import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { Attachment, AttachmentWithUrl, attachmentSchema } from "shared";
import { allowedAttachmentTypes, maxAttachmentBytes } from "shared/const";
import { getTableName } from "../repository";
import { addDbMiddleware } from "../service";
import { AttachmentRepository } from "./repository";
import { DbAttachmentEntity } from "./schema";

const UPLOAD_URL_TTL_SECONDS = 300; // short — minted right before the browser PUTs
const VIEW_URL_TTL_SECONDS = 3600; // outlives the client's 5 min query staleTime

// Region/credentials come from the environment: the Lambda role in prod, the
// developer's AWS profile locally (see server/.env.example).
// WHEN_REQUIRED stops the SDK (>=3.729) signing a CRC32 of the empty body
// into presigned PUT urls, which would make every real browser upload fail
// S3's checksum validation.
const s3 = new S3Client({
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const getImagesBucket = (): string => {
  const bucket = process.env.IMAGES_BUCKET;
  if (!bucket) {
    throw new Error(
      "Image uploads are not configured: IMAGES_BUCKET is unset (see server/.env.example)"
    );
  }
  return bucket;
};

// S3 keys avoid '#' (awkward in URLs and the console). Prefixing with the
// user's table name gives uploads the same prod/staging/test isolation as the
// tables themselves.
const buildS3Key = (ownerId: string, uuid: string, user: User): string =>
  `${getTableName(user)}/${ownerId.replace(/#/g, "_")}/${uuid}`;

export class AttachmentService {
  attachmentRepository = new AttachmentRepository();

  async createUploadUrl(
    input: {
      ownerId: string;
      contentType: (typeof allowedAttachmentTypes)[number];
      size: number;
    },
    user: User
  ): Promise<{ attachmentId: string; uploadUrl: string }> {
    try {
      const uuid = uuidv4();
      const command = new PutObjectCommand({
        Bucket: getImagesBucket(),
        Key: buildS3Key(input.ownerId, uuid, user),
        ContentType: input.contentType,
      });
      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: UPLOAD_URL_TTL_SECONDS,
      });
      return { attachmentId: `att#${uuid}`, uploadUrl };
    } catch (error) {
      console.error("Service Layer Error creating upload url:", error);
      throw error;
    }
  }

  // Called after the browser PUT succeeds; only then does the row exist, so a
  // failed/abandoned upload never shows up in listings. HEAD gives the
  // authoritative size/contentType — a presigned PUT cannot enforce a size cap.
  async confirm(
    input: {
      ownerId: string;
      attachmentId: string;
      fileName: string;
      date: string;
    },
    user: User
  ): Promise<Attachment> {
    try {
      const bucket = getImagesBucket();
      const uuid = input.attachmentId.replace(/^att#/, "");
      const s3Key = buildS3Key(input.ownerId, uuid, user);

      let head;
      try {
        head = await s3.send(
          new HeadObjectCommand({ Bucket: bucket, Key: s3Key })
        );
      } catch {
        throw new Error("Uploaded file not found; please upload again");
      }

      const contentType = allowedAttachmentTypes.find(
        (type) => type === head.ContentType
      );
      const size = head.ContentLength ?? 0;
      if (!contentType || size === 0 || size > maxAttachmentBytes) {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: s3Key }));
        throw new Error(
          `Upload rejected: must be an image, PDF or document (.docx, .doc, .odt) no larger than ${
            maxAttachmentBytes / (1024 * 1024)
          }MB`
        );
      }

      const entity: DbAttachmentEntity = addDbMiddleware(
        {
          pK: input.ownerId,
          sK: input.attachmentId,
          entityType: "attachment" as const,
          date: input.date,
          details: { fileName: input.fileName, contentType, size, s3Key },
        },
        user
      );
      await this.attachmentRepository.create(entity, user);
      return this.transformDbAttachmentToShared(entity);
    } catch (error) {
      console.error("Service Layer Error confirming attachment:", error);
      throw error;
    }
  }

  // Attaches presigned view URLs to already-fetched att# rows; called by the
  // owning entity's getById, which serves attachments as part of the person.
  // Never throws on a missing IMAGES_BUCKET — that would take down every
  // detail view of an owner holding attachments — the urls are just empty.
  async withViewUrls(rows: DbAttachmentEntity[]): Promise<AttachmentWithUrl[]> {
    try {
      if (rows.length === 0) return [];
      const bucket = process.env.IMAGES_BUCKET;
      if (!bucket) {
        console.warn(
          "IMAGES_BUCKET is unset: serving attachments without view urls"
        );
      }
      const withUrls = await Promise.all(
        rows.map(async (row) => ({
          ...this.transformDbAttachmentToShared(row),
          url: bucket
            ? await getSignedUrl(
                s3,
                new GetObjectCommand({
                  Bucket: bucket,
                  Key: row.details.s3Key,
                }),
                { expiresIn: VIEW_URL_TTL_SECONDS }
              )
            : "",
        }))
      );
      // newest document date first; upload time breaks ties
      return withUrls.sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.updatedAt.localeCompare(a.updatedAt)
      );
    } catch (error) {
      console.error("Service Layer Error signing attachment urls:", error);
      throw error;
    }
  }

  async delete(
    ownerId: string,
    attachmentId: string,
    user: User
  ): Promise<void> {
    try {
      const row = await this.attachmentRepository.getById(
        ownerId,
        attachmentId,
        user
      );
      if (!row) return; // already gone — deleting is idempotent
      // Object first (S3 deletes are idempotent, so a retry after a partial
      // failure just works); row second.
      await s3.send(
        new DeleteObjectCommand({
          Bucket: getImagesBucket(),
          Key: row.details.s3Key,
        })
      );
      await this.attachmentRepository.delete(ownerId, attachmentId, user);
    } catch (error) {
      console.error("Service Layer Error deleting attachment:", error);
      throw error;
    }
  }

  // Removes every attachment (objects + rows) for an owner; used when the
  // owning client is deleted so S3 objects aren't orphaned.
  async purgeForOwner(ownerId: string, user: User): Promise<void> {
    try {
      const rows = await this.attachmentRepository.listByOwner(ownerId, user);
      await Promise.all(rows.map((row) => this.delete(ownerId, row.sK, user)));
    } catch (error) {
      console.error("Service Layer Error purging attachments:", error);
      throw error;
    }
  }

  private transformDbAttachmentToShared(row: DbAttachmentEntity): Attachment {
    // parse strips server-only fields (s3Key) from details
    return attachmentSchema.parse({
      id: row.sK,
      ownerId: row.pK,
      updatedAt: row.updatedAt,
      date: row.date,
      details: row.details,
    });
  }
}
