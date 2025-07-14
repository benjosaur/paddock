import { MpFull, mpFullSchema, MpMetadata, mpMetadataSchema } from "shared";
import { MpRepository } from "./repository";
import {
  DbMpFull,
  DbMpMetadata,
  DbMpEntity,
  DbMpTrainingRecordEntity,
} from "./schema";
import { MpLogService } from "../package/service";
import { TrainingRecordService } from "../training/service";
import { DbMpLogMp } from "../package/schema";
import { TrainingRecordRepository } from "../training/repository";
import { MpLogRepository } from "../package/repository";

export class MpService {
  mpRepository = new MpRepository();
  mpLogService = new MpLogService();
  mpLogRepository = new MpLogRepository();
  trainingRecordService = new TrainingRecordService();
  trainingRecordRepository = new TrainingRecordRepository();

  async getAll(user: User): Promise<MpMetadata[]> {
    try {
      const mps = await this.mpRepository.getAll(user);
      const transformedResult = this.transformDbMpToSharedMetaData(
        mps
      ) as MpMetadata[];
      const parsedResult = mpMetadataSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all MPs:", error);
      throw error;
    }
  }

  async getById(user: User, mpId: string): Promise<MpFull> {
    try {
      const mp = await this.mpRepository.getById(user, mpId);
      const mpLogIds = mp
        .filter((dbResult) => dbResult.entityType == "mpLog")
        .map((mpLog) => mpLog.sK);
      const mpLogs = await Promise.all(
        mpLogIds.map(
          async (mpLogId) => await this.mpLogService.getById(user, mpLogId)
        )
      );
      const mpMetadata = this.transformDbMpToSharedMetaData(mp);
      const fullMp: MpFull[] = [{ ...mpMetadata[0], mpLogs }];
      const parsedResult = mpFullSchema.array().parse(fullMp);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error getting MP by ID:", error);
      throw error;
    }
  }

  async create(newMp: Omit<MpMetadata, "id">, user: User): Promise<MpFull> {
    try {
      const validatedInput = mpFullSchema.omit({ id: true }).parse(newMp);

      const mpToCreate: Omit<DbMpEntity, "id" | "pK" | "sK"> = {
        ...validatedInput,
        entityType: "mp",
        entityOwner: "mp",
      };
      const createdMpId = await this.mpRepository.create(mpToCreate, user);

      const fetchedMp = await this.getById(user, createdMpId);
      if (!fetchedMp) {
        throw new Error("Failed to fetch created mp");
      }

      const { id, ...restFetched } = fetchedMp;

      if (JSON.stringify(validatedInput) !== JSON.stringify(restFetched)) {
        throw new Error("Created mp does not match expected values");
      }

      return fetchedMp;
    } catch (error) {
      console.error("Service Layer Error creating MP:", error);
      throw error;
    }
  }

  async update(updatedMp: MpMetadata, user: User): Promise<MpFull> {
    // NB Not for name updates as otherwise need to update associated logs::details and record::details
    try {
      const validatedInput = mpMetadataSchema.parse(updatedMp);

      const dbMp: DbMpEntity = {
        pK: validatedInput.id,
        sK: validatedInput.id,
        entityType: "mp",
        entityOwner: "mp",
        dateOfBirth: validatedInput.dateOfBirth,
        postCode: validatedInput.postCode,
        recordName: validatedInput.recordName,
        recordExpiry: validatedInput.recordExpiry,
        details: validatedInput.details,
      };

      await this.mpRepository.update(dbMp, user);
      const fetchedMp = await this.getById(user, validatedInput.id);

      // below will throw error on name update. input name will be diff to updated training record name. as fetch will occur at same time as record name update.
      // if (
      //   JSON.stringify(validatedInput) !==
      //   JSON.stringify(mpMetadataSchema.parse(fetchedMp))
      // ) {
      //   console.log(validatedInput, mpMetadataSchema.parse(fetchedMp));
      //   throw new Error("Updated mp does not match expected values");
      // }

      return fetchedMp;
    } catch (error) {
      console.error("Service Layer Error updating MP:", error);
      throw error;
    }
  }

  async updateName(mpId: string, newName: string, user: User): Promise<MpFull> {
    try {
      const initialMp = await this.getById(user, mpId);

      const updatedMp = {
        ...initialMp,
        details: { ...initialMp.details, name: newName },
      };
      const updatedMpTrainingRecords: DbMpTrainingRecordEntity[] =
        initialMp.trainingRecords.map((record) => ({
          pK: mpId,
          sK: record.id,
          recordExpiry: record.recordExpiry,
          recordName: record.recordName,
          details: { ...record.details, name: newName },
          entityOwner: "mp",
          entityType: "trainingRecord",
        }));
      const updatedMpLogMps: DbMpLogMp[] = initialMp.mpLogs.map((log) => ({
        pK: mpId,
        sK: log.id,
        postCode: initialMp.postCode,
        date: log.date,
        details: { ...log.details, name: newName },
        entityOwner: "mp",
        entityType: "mpLog",
      }));
      await Promise.all([
        this.update(updatedMp, user),
        ...updatedMpTrainingRecords.map((record) =>
          this.trainingRecordRepository.update(record, user)
        ),
        ...updatedMpLogMps.map((log) =>
          this.mpLogRepository.update([log], user)
        ),
      ]);

      const fetchedMp = this.getById(user, mpId);

      return fetchedMp;
    } catch (error) {
      console.error("Service Layer Error updating Mp Name:", error);
      throw error;
    }
  }

  async delete(user: User, mpId: string): Promise<number[]> {
    try {
      const deletedCount = await this.mpRepository.delete(user, mpId);
      return deletedCount;
    } catch (error) {
      console.error("Service Layer Error deleting MP:", error);
      throw error;
    }
  }

  private transformDbMpToSharedMetaData(
    items: DbMpMetadata[] | DbMpFull[]
  ): MpMetadata[] {
    const mpsMap = new Map<string, Partial<MpFull>>();

    for (const item of items) {
      const mpId = item.pK;

      if (!mpsMap.has(mpId)) {
        mpsMap.set(mpId, {
          id: mpId,
        });
      }

      const mp = mpsMap.get(mpId)!;

      switch (item.entityType) {
        case "mp":
          mp.dateOfBirth = item.dateOfBirth;
          mp.postCode = item.postCode;
          mp.details = item.details;
          mp.recordName = item.recordName;
          mp.recordExpiry = item.recordExpiry;
          break;
        case "trainingRecord":
          if (!mp.trainingRecords) mp.trainingRecords = [];
          mp.trainingRecords.push({
            id: item.sK,
            ownerId: item.pK,
            recordName: item.recordName,
            recordExpiry: item.recordExpiry,
            details: item.details,
          });
          break;
        case "mpLog":
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }

    return Array.from(mpsMap.values()) as MpMetadata[] | MpFull[];
  }
}
