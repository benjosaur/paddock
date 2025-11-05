import {
  MpFull,
  mpFullSchema,
  MpMetadata,
  mpMetadataSchema,
  EndPersonDetails,
  endPersonDetailsSchema,
  CoreTrainingRecordCompletion,
  coreTrainingRecordCompletionSchema,
} from "shared";
import { MpRepository } from "./repository";
import { DbMpFull, DbMpMetadata, DbMpEntity } from "./schema";
import { PackageService } from "../package/service";
import { TrainingRecordService } from "../training/service";
import { DbReqPackage } from "../package/schema";
import { TrainingRecordRepository } from "../training/repository";
import { PackageRepository } from "../package/repository";
import { DbTrainingRecord } from "../training/schema";
import { RequestService } from "../requests/service";
import { genericUpdate } from "../repository";
import { addDbMiddleware } from "../service";
import { coreTrainingRecordTypes } from "shared/const";

export class MpService {
  mpRepository = new MpRepository();
  packageService = new PackageService();
  packageRepository = new PackageRepository();
  requestService = new RequestService();
  trainingRecordService = new TrainingRecordService();
  trainingRecordRepository = new TrainingRecordRepository();

  // archived concept removed; use getAll and filter by endDate where needed

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

  async getAllNotEnded(user: User): Promise<MpMetadata[]> {
    try {
      const dbMps = await this.mpRepository.getAllNotEnded(user);
      const dbTrainingRecords =
        await this.trainingRecordRepository.getAllNotEnded(user);
      const dbPackages = await this.packageRepository.getAllNotEndedYet(user);
      const transformedResult = this.transformDbMpToSharedMetaData([
        ...dbMps,
        ...dbTrainingRecords,
        ...dbPackages,
      ]);

      const parsedResult = mpMetadataSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all not ended mps:", error);
      throw error;
    }
  }

  async getById(mpId: string, user: User): Promise<MpFull> {
    try {
      const mpDbResults = await this.mpRepository.getById(mpId, user);
      const requestIds = mpDbResults
        .filter(
          (dbResult): dbResult is DbReqPackage => dbResult.sK.startsWith("pkg") // mps dont have sole packages
        )
        .map((pkg) => pkg.requestId);
      const requests = await Promise.all(
        requestIds.map(
          async (requestId) =>
            await this.requestService.getById(requestId, user)
        )
      );
      const mpMetadata = this.transformDbMpToSharedMetaData(mpDbResults);
      const fullMp: MpFull[] = [{ ...mpMetadata[0], requests }];
      const parsedResult = mpFullSchema.array().parse(fullMp);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error getting MP by ID:", error);
      throw error;
    }
  }

  async getCoreTrainingRecordCompletions(
    withEnded: boolean,
    user: User
  ): Promise<CoreTrainingRecordCompletion[]> {
    try {
      const mps = withEnded
        ? await this.getAll(user)
        : await this.getAllNotEnded(user);

      const coreCompletions = mps.map((mp): CoreTrainingRecordCompletion => {
        const coreTrainingRecords = mp.trainingRecords.filter((tr) => {
          return coreTrainingRecordTypes.some(
            (type) => type === tr.details.recordName
          );
        });
        const earliestCompletedRecord =
          coreTrainingRecords.length > 0
            ? coreTrainingRecords.reduce((earliest, current) => {
                return new Date(current.completionDate) <
                  new Date(earliest.completionDate)
                  ? current
                  : earliest;
              }, coreTrainingRecords[0])
            : null;

        return {
          carer: { id: mp.id, name: mp.details.name },
          coreCompletionRate: Number(
            (
              100 *
              (coreTrainingRecords.length / coreTrainingRecordTypes.length)
            ).toFixed(2)
          ),
          earliestCompletionDate: earliestCompletedRecord?.completionDate ?? "",
          coreRecords:
            coreTrainingRecords as CoreTrainingRecordCompletion["coreRecords"],
        };
      });

      const parsedResult = coreTrainingRecordCompletionSchema
        .array()
        .parse(coreCompletions);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting core training record completions:",
        error
      );
      throw error;
    }
  }

  async create(newMp: Omit<MpMetadata, "id">, user: User): Promise<string> {
    // not for packages
    try {
      const validatedInput = mpMetadataSchema.omit({ id: true }).parse(newMp);

      const mpToCreate: Omit<DbMpEntity, "pK" | "sK"> = addDbMiddleware(
        {
          ...validatedInput,
          entityType: "mp",
        },
        user
      );
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
      const dbMp: DbMpEntity = addDbMiddleware(
        {
          pK: id,
          sK: id,
          entityType: "mp",
          ...rest,
        },
        user
      );
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

  // toggleArchive removed – use end()

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
        const { pK, sK, entityType, ...rest } = item as DbReqPackage; // mps dont have sole packages
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

  async end(user: User, input: EndPersonDetails): Promise<void> {
    try {
      const validated = endPersonDetailsSchema.parse(input);
      const records = await this.mpRepository.getById(validated.personId, user);
      const transformedMp = this.transformDbMpToSharedMetaData(records)[0];
      if (!transformedMp) throw new Error("MP record not found");
      const validatedMp = mpMetadataSchema.parse(transformedMp);
      const { id, trainingRecords, packages, ...rest } = validatedMp;
      const dbMp: DbMpEntity = addDbMiddleware(
        {
          ...rest,
          pK: id,
          sK: id,
          entityType: "mp",
          endDate: validated.endDate,
        },
        user
      );
      const mpUpdate = this.mpRepository.update(dbMp, user);

      const trUpdates = (trainingRecords ?? []).map((tr: any) =>
        this.trainingRecordService.end(user, {
          ownerId: tr.ownerId,
          recordId: tr.id,
          endDate: validated.endDate,
        })
      );

      const pkgUpdates = (packages ?? []).map((pkg: any) =>
        this.packageService.endPackage(user, {
          packageId: pkg.id,
          endDate: validated.endDate,
        })
      );

      await Promise.all([mpUpdate, ...trUpdates, ...pkgUpdates]);
    } catch (error) {
      console.error("Service Layer Error ending MP:", error);
      throw error;
    }
  }
}
