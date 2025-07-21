import { MpFull, mpFullSchema, MpMetadata, mpMetadataSchema } from "shared";
import { MpRepository } from "./repository";
import { DbMpFull, DbMpMetadata, DbMpEntity } from "./schema";
import { PackageService } from "../package/service";
import { TrainingRecordService } from "../training/service";
import { DbPackage } from "../package/schema";
import { TrainingRecordRepository } from "../training/repository";
import { PackageRepository } from "../package/repository";
import { DbTrainingRecord } from "../training/schema";
import { RequestService } from "../requests/service";

export class MpService {
  mpRepository = new MpRepository();
  packageService = new PackageService();
  packageRepository = new PackageRepository();
  requestService = new RequestService();
  trainingRecordService = new TrainingRecordService();
  trainingRecordRepository = new TrainingRecordRepository();

  async getAllActive(user: User): Promise<MpMetadata[]> {
    try {
      const dbMps = await this.mpRepository.getAllActive(user);
      const dbTrainingRecords =
        await this.trainingRecordRepository.getAllActive(user);
      const dbPackages = await this.packageRepository.getAllActive(user);
      const transformedResult = this.transformDbMpToSharedMetaData([
        ...dbMps,
        ...dbTrainingRecords,
        ...dbPackages,
      ]);
      const parsedResult = mpMetadataSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all mps:", error);
      throw error;
    }
  }

  async getAll(user: User): Promise<MpMetadata[]> {
    try {
      const dbMps = await this.mpRepository.getAll(user);
      const dbTrainingRecords = await this.trainingRecordRepository.getAll(
        user
      );
      const dbPackages = await this.packageRepository.getAll(user);
      const transformedResult = this.transformDbMpToSharedMetaData([
        ...dbMps,
        ...dbTrainingRecords,
        ...dbPackages,
      ]);
      const parsedResult = mpMetadataSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all mps:", error);
      throw error;
    }
  }

  async getById(mpId: string, user: User): Promise<MpFull> {
    try {
      const mp = await this.mpRepository.getById(mpId, user);
      const requestIds = mp
        .filter((dbResult): dbResult is DbPackage =>
          dbResult.sK.startsWith("pkg")
        )
        .map((pkg) => pkg.requestId);
      const requests = await Promise.all(
        requestIds.map(
          async (requestId) =>
            await this.requestService.getById(requestId, user)
        )
      );
      const mpMetadata = this.transformDbMpToSharedMetaData(mp);
      const fullMp: MpFull[] = [{ ...mpMetadata[0], requests }];
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
    const mpsMap = new Map<string, Partial<MpMetadata>>();

    for (const item of items) {
      if (item.pK.startsWith("v")) continue;
      // this is a volunteer tr/pkg which we do not want to consider
      const mpId = item.pK;

      if (!mpsMap.has(mpId)) {
        mpsMap.set(mpId, {
          id: mpId,
        });
      }

      const mp = mpsMap.get(mpId)!;
      if (item.sK.startsWith("m")) {
        const { pK, sK, entityType, ...rest } = item as DbMpEntity;
        const fetchedMp: Omit<MpMetadata, "packages" | "trainingRecords"> = {
          id: pK,
          ...rest,
        };
        Object.assign(mp, fetchedMp);
        continue;
      } else if (item.sK.startsWith("tr")) {
        if (!mp.trainingRecords) mp.trainingRecords = [];
        const { pK, sK, entityType, ...rest } = item as DbTrainingRecord;
        mp.trainingRecords.push({
          id: sK,
          ownerId: pK,
          ...rest,
        });
        continue;
      } else if (item.sK.startsWith("pkg")) {
        if (!mp.packages) mp.packages = [];
        const { pK, sK, entityType, ...rest } = item as DbPackage;
        mp.packages.push({
          id: sK,
          carerId: pK,
          ...rest,
        });
        continue;
      } else if (item.sK.startsWith("mag")) {
        continue;
      } else throw new Error(`Undefined Case: ${item}`);
    }

    return Array.from(mpsMap.values()) as MpMetadata[];
  }
}
