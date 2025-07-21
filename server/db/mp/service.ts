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
import { genericUpdate } from "../repository";

export class MpService {
  mpRepository = new MpRepository();
  packageService = new PackageService();
  packageRepository = new PackageRepository();
  requestService = new RequestService();
  trainingRecordService = new TrainingRecordService();
  trainingRecordRepository = new TrainingRecordRepository();

  async getAllNotArchived(user: User): Promise<MpMetadata[]> {
    try {
      const dbMps = await this.mpRepository.getAllNotArchived(user);
      const dbTrainingRecords =
        await this.trainingRecordRepository.getAllNotArchived(user);
      const dbPackages = await this.packageRepository.getAllNotArchived(user);
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

  async create(newMp: Omit<MpMetadata, "id">, user: User): Promise<string> {
    // not for packages
    try {
      const validatedInput = mpMetadataSchema.omit({ id: true }).parse(newMp);

      const mpToCreate: Omit<DbMpEntity, "pK" | "sK"> = {
        ...validatedInput,
        entityType: "mp",
      };
      const createdMpId = await this.mpRepository.create(mpToCreate, user);
      return createdMpId;
    } catch (error) {
      console.error("Service Layer Error creating MP:", error);
      throw error;
    }
  }

  async update(updatedMp: MpMetadata, user: User): Promise<void> {
    // also not for packages
    // NB Not for name updates as otherwise need to update associated logs::details and record::details
    try {
      const validatedInput = mpMetadataSchema.parse(updatedMp);
      const { id, ...rest } = validatedInput;
      const dbMp: DbMpEntity = { pK: id, sK: id, entityType: "mp", ...rest };
      await this.mpRepository.update(dbMp, user);
    } catch (error) {
      console.error("Service Layer Error updating MP:", error);
      throw error;
    }
  }

  async updateName(mpId: string, newName: string, user: User): Promise<void> {
    try {
      const initialMpRecords = await this.mpRepository.getById(mpId, user);
      const updatedMpRecords = initialMpRecords.map((record) => ({
        ...record,
        details: { ...record.details, name: newName },
      }));
      await genericUpdate(updatedMpRecords, user);
    } catch (error) {
      console.error("Service Layer Error updating Mp Name:", error);
      throw error;
    }
  }

  async delete(user: User, mpId: string): Promise<number[]> {
    try {
      const deletedCount = await this.mpRepository.delete(mpId, user);
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
