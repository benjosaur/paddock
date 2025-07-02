import { MpFull, mpFullSchema, MpMetadata, mpMetadataSchema } from "shared";
import { MpRepository } from "./repository";
import { DbMpFull, DbMpMetadata, DbMpEntity } from "./schema";
import { MpLogService } from "../mplog/service";
import { TrainingRecordService } from "../training/service";
import assert from "assert";

export class MpService {
  mpRepository = new MpRepository();
  mpLogService = new MpLogService();
  trainingRecordService = new TrainingRecordService();

  async getAll(): Promise<MpMetadata[]> {
    try {
      const mps = await this.mpRepository.getAll();
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

  async getById(mpId: string): Promise<MpFull> {
    try {
      const mp = await this.mpRepository.getById(mpId);
      const mpLogIds = mp
        .filter((dbResult) => dbResult.entityType == "mpLog")
        .map((mpLog) => mpLog.sK);
      const mpLogs = await Promise.all(
        mpLogIds.map(
          async (mpLogId) => await this.mpLogService.getById(mpLogId)
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

  async create(newMp: Omit<MpMetadata, "id">, userId: string): Promise<MpFull> {
    try {
      const mpToCreate: Omit<DbMpEntity, "id" | "pK" | "sK"> = {
        ...newMp,
        entityType: "mp",
        entityOwner: "mp",
      };
      const createdMpId = await this.mpRepository.create(mpToCreate, userId);

      const fetchedMp = await this.getById(createdMpId);
      if (!fetchedMp) {
        throw new Error("Failed to fetch created mp");
      }

      const { id, mpLogs, trainingRecords, ...restFetched } = fetchedMp;

      if (JSON.stringify(newMp) !== JSON.stringify(restFetched)) {
        throw new Error("Created mp does not match expected values");
      }

      return fetchedMp;
    } catch (error) {
      console.error("Service Layer Error creating MP:", error);
      throw error;
    }
  }

  async update(updatedMp: MpMetadata, userId: string): Promise<MpFull> {
    // NB Not for name updates as otherwise need to update associated logs::details and record::details
    try {
      const dbMp: DbMpEntity = {
        pK: updatedMp.id,
        sK: updatedMp.id,
        entityType: "mp",
        entityOwner: "mp",
        dateOfBirth: updatedMp.dateOfBirth,
        postCode: updatedMp.postCode,
        recordName: updatedMp.recordName,
        recordExpiry: updatedMp.recordExpiry,
        details: updatedMp.details,
      };

      await this.mpRepository.update(dbMp, userId);
      const fetchedMp = await this.getById(updatedMp.id);

      const { mpLogs, trainingRecords, ...restFetched } = fetchedMp;

      if (JSON.stringify(updatedMp) !== JSON.stringify(restFetched)) {
        throw new Error("Updated mp does not match expected values");
      }

      return fetchedMp;
    } catch (error) {
      console.error("Service Layer Error updating MP:", error);
      throw error;
    }
  }

  async updateName(updatedMp: MpFull, userId: string): Promise<MpFull> {
    // Must update also duplicated name field in mplog details and training log details
    try {
      await this.update(updatedMp, userId);
      await Promise.all(
        updatedMp.trainingRecords.map((record) =>
          this.trainingRecordService.update(record, userId)
        )
      );
      await Promise.all(
        updatedMp.mpLogs.map((log) => this.mpLogService.update(log, userId))
      );
      const fetchedMp = await this.getById(updatedMp.id);
      const parsedResult = mpFullSchema.parse(fetchedMp);
      assert.deepStrictEqual(updatedMp, parsedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error updating MP Name:", error);
      throw error;
    }
  }

  async delete(mpId: string): Promise<number[]> {
    try {
      const deletedCount = await this.mpRepository.delete(mpId);
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
