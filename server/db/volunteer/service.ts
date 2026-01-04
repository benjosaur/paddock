import {
  CoreTrainingRecordCompletion,
  coreTrainingRecordCompletionSchema,
  Package,
  VolunteerFull,
  volunteerFullSchema,
  VolunteerMetadata,
  volunteerMetadataSchema,
} from "shared";
import { VolunteerRepository } from "./repository";
import {
  DbVolunteerFull,
  DbVolunteerMetadata,
  DbVolunteerEntity,
} from "./schema";
import { TrainingRecordService } from "../training/service";
import { TrainingRecordRepository } from "../training/repository";
import { DbTrainingRecord } from "../training/schema";
import { DbReqPackage, DbSolePackage } from "../package/schema";
import { PackageService } from "../package/service";
import { PackageRepository } from "../package/repository";
import { RequestService } from "../requests/service";
import { genericUpdate } from "../repository";
import { addDbMiddleware } from "../service";
import { EndPersonDetails, endPersonDetailsSchema } from "shared";
import { coreTrainingRecordTypes, firstYear } from "shared/const";
import { getEarliestDate, getLatestDate } from "shared/utils";

export class VolunteerService {
  volunteerRepository = new VolunteerRepository();
  packageService = new PackageService();
  requestService = new RequestService();
  trainingRecordService = new TrainingRecordService();
  packageRepository = new PackageRepository();
  trainingRecordRepository = new TrainingRecordRepository();

  async getAll(user: User): Promise<VolunteerMetadata[]> {
    try {
      const dbVolunteers = await this.volunteerRepository.getAll(user);
      const dbTrainingRecords = await this.trainingRecordRepository.getAll(
        user
      );
      const dbPackages = await this.packageRepository.getAll(user);
      const transformedResult = this.transformDbVolunteerToSharedMetaData([
        ...dbVolunteers,
        ...dbTrainingRecords,
        ...dbPackages,
      ]);
      const parsedResult = volunteerMetadataSchema
        .array()
        .parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all volunteers:", error);
      throw error;
    }
  }

  async getAllNotEndedYet(user: User): Promise<VolunteerMetadata[]> {
    try {
      const dbVolunteers = await this.volunteerRepository.getAllNotEndedYet(
        user
      );
      const dbTrainingRecords =
        await this.trainingRecordRepository.getAllNotEndedYet(user);
      const dbPackages = await this.packageRepository.getAllNotEndedYet(user);
      const transformedResult = this.transformDbVolunteerToSharedMetaData([
        ...dbVolunteers,
        ...dbTrainingRecords,
        ...dbPackages,
      ]);
      const parsedResult = volunteerMetadataSchema
        .array()
        .parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting all not ended yet volunteers:",
        error
      );
      throw error;
    }
  }

  async getById(volunteerId: string, user: User): Promise<VolunteerFull> {
    try {
      const volunteer = await this.volunteerRepository.getById(
        volunteerId,
        user
      );
      const requestIds = volunteer
        .filter(
          (dbResult): dbResult is DbReqPackage =>
            dbResult.sK.startsWith("pkg") && "requestId" in dbResult
        )
        .map((pkg) => pkg.requestId);

      const solePackages = volunteer
        .filter(
          (dbResult): dbResult is DbSolePackage =>
            dbResult.sK.startsWith("pkg") && !("requestId" in dbResult)
        )
        .map((pkg) => {
          const { pK, sK, entityType, ...rest } = pkg;
          return {
            ...rest,
            id: pK,
            carerId: sK,
          };
        });

      const requests = await Promise.all(
        requestIds.map(
          async (requestId) =>
            await this.requestService.getById(requestId, user)
        )
      );
      const volunteerMetadata =
        this.transformDbVolunteerToSharedMetaData(volunteer);
      const fullVolunteer: VolunteerFull[] = [
        { ...volunteerMetadata[0], requests, solePackages },
      ];
      const parsedResult = volunteerFullSchema.array().parse(fullVolunteer);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error getting Volunteer by ID:", error);
      throw error;
    }
  }

  async getCoordinatorIds(user: User): Promise<string[]> {
    try {
      const volunteers = await this.getAll(user);
      const coordinatorIds = volunteers
        .filter((volunteer) => volunteer.details.role === "Coordinator")
        .map((volunteer) => volunteer.id);
      return coordinatorIds;
    } catch (error) {
      console.error("Service Layer Error getting coordinator IDs:", error);
      throw error;
    }
  }

  async getAllPackagesByCoordinator(
    user: User,
    startYear: number = firstYear
  ): Promise<Package[]> {
    try {
      const coordinatorIds = await this.getCoordinatorIds(user);
      const packages = await this.packageService.getAll(user, startYear);
      const coordinatorPackages = packages.filter((pkg) =>
        coordinatorIds.includes(pkg.carerId)
      );
      return coordinatorPackages;
    } catch (error) {
      console.error(
        "Service Layer Error getting all packages for coordinator:",
        error
      );
      throw error;
    }
  }

  async getCoreTrainingRecordCompletions(
    withEnded: boolean,
    user: User
  ): Promise<CoreTrainingRecordCompletion[]> {
    try {
      const volunteers = withEnded
        ? await this.getAll(user)
        : await this.getAllNotEndedYet(user);

      const coreCompletions = volunteers.map(
        (volunteer): CoreTrainingRecordCompletion => {
          const volunteerCoreCompletionDates = coreTrainingRecordTypes.reduce(
            (acc, recordName) => {
              acc[recordName] = [];
              return acc;
            },
            {} as Record<(typeof coreTrainingRecordTypes)[number], string[]>
          );

          for (const record of volunteer.trainingRecords) {
            const isCoreRecord = coreTrainingRecordTypes.some(
              (name) => name == record.details.recordName
            );
            if (isCoreRecord)
              volunteerCoreCompletionDates[
                record.details
                  .recordName as (typeof coreTrainingRecordTypes)[number]
              ].push(record.completionDate);
          }

          const latestVolunteerCoreCompletions = Object.entries(
            volunteerCoreCompletionDates
          ).reduce((acc, entry) => {
            const [_, dates] = entry;
            const earliestDate = getLatestDate(dates);
            if (earliestDate) return [...acc, earliestDate];
            return acc;
          }, [] as string[]);

          const earliestCoreCompletionDate = getEarliestDate(
            latestVolunteerCoreCompletions
          );

          const coreCompletionCount = latestVolunteerCoreCompletions.length;
          const coreCompletionRate =
            coreCompletionCount / coreTrainingRecordTypes.length;

          return {
            carer: { id: volunteer.id, name: volunteer.details.name },
            coreCompletionRate: Number((100 * coreCompletionRate).toFixed(2)),
            earliestCoreCompletionDate: earliestCoreCompletionDate ?? "",
          };
        }
      );

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

  async create(
    newVolunteer: Omit<VolunteerMetadata, "id">,
    user: User
  ): Promise<string> {
    // not for packages
    try {
      const validatedInput = volunteerMetadataSchema
        .omit({ id: true })
        .parse(newVolunteer);

      const volunteerToCreate: Omit<DbVolunteerEntity, "pK" | "sK"> =
        addDbMiddleware(
          {
            ...validatedInput,
            entityType: "volunteer",
          },
          user
        );
      const createdVolunteerId = await this.volunteerRepository.create(
        volunteerToCreate,
        user
      );
      return createdVolunteerId;
    } catch (error) {
      console.error("Service Layer Error creating MP:", error);
      throw error;
    }
  }

  async update(updatedVolunteer: VolunteerMetadata, user: User): Promise<void> {
    // also not for packages
    // NB Not for name updates as otherwise need to update associated logs::details and record::details
    try {
      const validatedInput = volunteerMetadataSchema.parse(updatedVolunteer);
      const { id, ...rest } = validatedInput;
      const dbVolunteer: DbVolunteerEntity = addDbMiddleware(
        {
          pK: id,
          sK: id,
          entityType: "volunteer",
          ...rest,
        },
        user
      );
      await this.volunteerRepository.update(dbVolunteer, user);
    } catch (error) {
      console.error("Service Layer Error updating MP:", error);
      throw error;
    }
  }

  async updateName(
    volunteerMetadata: VolunteerMetadata,
    newName: string,
    user: User
  ): Promise<void> {
    try {
      const { id, packages, trainingRecords, ...updatedVolunteerMetadata } =
        volunteerMetadataSchema.parse(volunteerMetadata);
      const updatedVolunteerEntity: DbVolunteerEntity = addDbMiddleware(
        {
          ...updatedVolunteerMetadata,
          pK: id,
          sK: id,
          entityType: "volunteer",
          details: { ...updatedVolunteerMetadata.details, name: newName },
        },
        user
      );
      const initialVolunteerRecords = await this.volunteerRepository.getById(
        id,
        user
      );
      const updatedVolunteerRecords = initialVolunteerRecords.map((record) => {
        if (record.sK.startsWith("v#")) {
          return updatedVolunteerEntity;
        } else {
          return addDbMiddleware(
            {
              ...record,
              details: { ...record.details, name: newName },
            },
            user
          );
        }
      });
      await genericUpdate(updatedVolunteerRecords, user);
    } catch (error) {
      console.error("Service Layer Error updating Volunteer Name:", error);
      throw error;
    }
  }

  async delete(user: User, volunteerId: string): Promise<number[]> {
    try {
      const deletedCount = await this.volunteerRepository.delete(
        volunteerId,
        user
      );
      return deletedCount;
    } catch (error) {
      console.error("Service Layer Error deleting MP:", error);
      throw error;
    }
  }

  // toggleArchive removed – use end()

  private transformDbVolunteerToSharedMetaData(
    items: DbVolunteerMetadata[] | DbVolunteerFull[]
  ): VolunteerMetadata[] {
    const volunteersMap = new Map<string, Partial<VolunteerMetadata>>();

    for (const item of items) {
      if (item.pK.startsWith("m")) continue;
      // this is an volunteer tr/pkg which we do not want to consider
      const volunteerId = item.pK;

      if (!volunteersMap.has(volunteerId)) {
        volunteersMap.set(volunteerId, {
          id: volunteerId,
        });
      }

      const volunteer = volunteersMap.get(volunteerId)!;
      if (item.sK.startsWith("v")) {
        const { pK, sK, entityType, ...rest } = item as DbVolunteerEntity;
        const fetchedVolunteer: Omit<
          VolunteerMetadata,
          "packages" | "trainingRecords"
        > = {
          id: pK,
          ...rest,
        };
        Object.assign(volunteer, fetchedVolunteer);
        continue;
      } else if (item.sK.startsWith("tr")) {
        if (!volunteer.trainingRecords) volunteer.trainingRecords = [];
        const { pK, sK, entityType, ...rest } = item as DbTrainingRecord;
        volunteer.trainingRecords.push({
          id: sK,
          ownerId: pK,
          ...rest,
        });
        continue;
      } else if (item.sK.startsWith("pkg") && "requestId" in item) {
        if (!volunteer.packages) volunteer.packages = [];
        const { pK, sK, entityType, ...rest } = item as DbReqPackage;
        volunteer.packages.push({
          id: sK,
          carerId: pK,
          ...rest,
        });
        continue;
      } else if (item.sK.startsWith("pkg")) {
        // this must be a Sole Package
        if (!volunteer.packages) volunteer.packages = [];
        const { pK, sK, entityType, ...rest } = item as DbSolePackage;
        volunteer.packages.push({
          id: sK,
          carerId: pK,
          ...rest,
        });
        continue;
      } else if (item.sK.startsWith("mag")) {
        continue;
      } else {
        console.dir(item, { depth: null });
        throw new Error(`Undefined Case: ${item}`);
      }
    }

    return Array.from(volunteersMap.values()) as VolunteerMetadata[];
  }

  async end(user: User, input: EndPersonDetails): Promise<void> {
    try {
      const validated = endPersonDetailsSchema.parse(input);
      const records = await this.volunteerRepository.getById(
        validated.personId,
        user
      );
      const transformedVolunteer =
        this.transformDbVolunteerToSharedMetaData(records)[0];
      if (!transformedVolunteer) throw new Error("Volunteer record not found");
      const validatedVolunteer =
        volunteerMetadataSchema.parse(transformedVolunteer);
      const { id, trainingRecords, packages, ...rest } = validatedVolunteer;
      const dbVolunteer: DbVolunteerEntity = addDbMiddleware(
        {
          ...rest,
          pK: id,
          sK: id,
          entityType: "volunteer",
          endDate: validated.endDate,
        },
        user
      );
      const vUpdate = this.volunteerRepository.update(dbVolunteer, user);

      const trUpdates = (trainingRecords ?? []).map((tr: any) =>
        this.trainingRecordService.end(user, {
          ownerId: tr.ownerId,
          recordId: tr.id,
          endDate: validated.endDate,
        })
      );

      const pkgUpdates = (packages ?? []).map((pkg: any) =>
        this.packageService.endPackageIfNotAlready(user, {
          packageId: pkg.id,
          endDate: validated.endDate,
        })
      );

      await Promise.all([vUpdate, ...trUpdates, ...pkgUpdates]);
    } catch (error) {
      console.error("Service Layer Error ending volunteer:", error);
      throw error;
    }
  }
}
