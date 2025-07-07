import { MpFull, mpFullSchema, MpMetadata, mpMetadataSchema } from "shared";
import { MpRepository } from "./repository";
import { DbMpFull, DbMpMetadata, DbMpEntity } from "./schema";
import { MpLogService } from "../mplog/service";
import { TrainingRecordService } from "../training/service";

export class MpService {
  mpRepository = new MpRepository();
  mpLogService = new MpLogService();
  trainingRecordService = new TrainingRecordService();

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
      const validatedInput = mpFullSchema.parse(updatedMp);

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

      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedMp)) {
        throw new Error("Updated mp does not match expected values");
      }

      return fetchedMp;
    } catch (error) {
      console.error("Service Layer Error updating MP:", error);
      throw error;
    }
  }

  async updateName(updatedMp: MpFull, user: User): Promise<MpFull> {
    // Must update also duplicated name field in mplog details and training log details
    try {
      const validatedInput = mpFullSchema.parse(updatedMp);

      await this.update(validatedInput, user);
      await Promise.all(
        validatedInput.trainingRecords.map((record) =>
          this.trainingRecordService.update(record, user)
        )
      );
      await Promise.all(
        validatedInput.mpLogs.map((log) => this.mpLogService.update(log, user))
      );
      const fetchedMp = await this.getById(user, validatedInput.id);

      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedMp)) {
        throw new Error("Updated mp name does not match expected values");
      }
      return fetchedMp;
    } catch (error) {
      console.error("Service Layer Error updating MP Name:", error);
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
