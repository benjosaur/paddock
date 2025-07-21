import {
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
  DbVolunteerTrainingRecordEntity,
} from "./schema";
import { VolunteerLogService } from "../vlog/service";
import { TrainingRecordService } from "../training/service";
import { VolunteerLogRepository } from "../vlog/repository";
import { TrainingRecordRepository } from "../training/repository";
import { DbVolunteerLogVolunteer } from "../vlog/schema";
import { DbTrainingRecord } from "../training/schema";
import { DbPackage } from "../package/schema";
import { PackageService } from "../package/service";
import { PackageRepository } from "../package/repository";
import { RequestService } from "../requests/service";

export class VolunteerService {
  volunteerRepository = new VolunteerRepository();
  packageService = new PackageService();
  requestService = new RequestService();
  trainingRecordService = new TrainingRecordService();
  packageRepository = new PackageRepository();
  trainingRecordRepository = new TrainingRecordRepository();

  async getAllActive(user: User): Promise<VolunteerMetadata[]> {
    try {
      const dbVolunteers = await this.volunteerRepository.getAllActive(user);
      const dbTrainingRecords =
        await this.trainingRecordRepository.getAllActive(user);
      const dbPackages = await this.packageRepository.getAllActive(user);
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
      console.log("VOLUNTEERS");
      console.log(transformedResult);
      const parsedResult = volunteerMetadataSchema
        .array()
        .parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all volunteers:", error);
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
      const volunteerMetadata =
        this.transformDbVolunteerToSharedMetaData(volunteer);
      const fullVolunteer: VolunteerFull[] = [
        { ...volunteerMetadata[0], requests },
      ];
      const parsedResult = volunteerFullSchema.array().parse(fullVolunteer);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error getting Volunteer by ID:", error);
      throw error;
    }
  }

  async create(
    newVolunteer: Omit<VolunteerMetadata, "id">,
    user: User
  ): Promise<VolunteerFull> {
    try {
      const validatedInput = volunteerFullSchema
        .omit({ id: true })
        .parse(newVolunteer);

      const volunteerToCreate: Omit<DbVolunteerEntity, "id" | "pK" | "sK"> = {
        ...validatedInput,
        entityType: "volunteer",
        entityOwner: "volunteer",
      };
      const createdVolunteerId = await this.volunteerRepository.create(
        volunteerToCreate,
        user
      );

      const fetchedVolunteer = await this.getById(user, createdVolunteerId);
      if (!fetchedVolunteer) {
        throw new Error("Failed to fetch created volunteer");
      }

      const { id, ...restFetched } = fetchedVolunteer;

      if (JSON.stringify(validatedInput) !== JSON.stringify(restFetched)) {
        throw new Error("Created volunteer does not match expected values");
      }

      return fetchedVolunteer;
    } catch (error) {
      console.error("Service Layer Error creating volunteer:", error);
      throw error;
    }
  }

  async update(
    updatedVolunteer: VolunteerMetadata,
    user: User
  ): Promise<VolunteerFull> {
    try {
      const validatedInput = volunteerMetadataSchema.parse(updatedVolunteer);

      const dbVolunteer: DbVolunteerEntity = {
        pK: validatedInput.id,
        sK: validatedInput.id,
        entityType: "volunteer",
        entityOwner: "volunteer",
        dateOfBirth: validatedInput.dateOfBirth,
        postCode: validatedInput.postCode,
        recordName: validatedInput.recordName,
        recordExpiry: validatedInput.recordExpiry,
        details: validatedInput.details,
      };

      await this.volunteerRepository.update(dbVolunteer, user);
      const fetchedVolunteer = await this.getById(user, validatedInput.id);

      // below will throw error on name update. input name will be diff to updated training record name. as fetch will occur at same time as record name update.
      // if (
      //   JSON.stringify(validatedInput) !==
      //   JSON.stringify(volunteerMetadataSchema.parse(fetchedVolunteer))
      // ) {
      //   throw new Error("Updated volunteer does not match expected values");
      // }

      return fetchedVolunteer;
    } catch (error) {
      console.error("Service Layer Error updating volunteer:", error);
      throw error;
    }
  }

  async updateName(
    volunteerId: string,
    newName: string,
    user: User
  ): Promise<VolunteerFull> {
    try {
      const initialVolunteer = await this.getById(user, volunteerId);

      const updatedVolunteer = {
        ...initialVolunteer,
        details: { ...initialVolunteer.details, name: newName },
      };
      const updatedVolunteerTrainingRecords: DbVolunteerTrainingRecordEntity[] =
        initialVolunteer.trainingRecords.map((record) => ({
          pK: volunteerId,
          sK: record.id,
          recordExpiry: record.recordExpiry,
          recordName: record.recordName,
          details: { ...record.details, name: newName },
          entityOwner: "volunteer",
          entityType: "trainingRecord",
        }));
      const updatedVolunteerLogVolunteers: DbVolunteerLogVolunteer[] =
        initialVolunteer.volunteerLogs.map((log) => ({
          pK: volunteerId,
          sK: log.id,
          postCode: initialVolunteer.postCode,
          date: log.date,
          details: { ...log.details, name: newName },
          entityOwner: "volunteer",
          entityType: "volunteerLog",
        }));
      await Promise.all([
        this.update(updatedVolunteer, user),
        ...updatedVolunteerTrainingRecords.map((record) =>
          this.trainingRecordRepository.update(record, user)
        ),
        ...updatedVolunteerLogVolunteers.map((log) =>
          this.volunteerLogRepository.update([log], user)
        ),
      ]);

      const fetchedVolunteer = this.getById(user, volunteerId);

      return fetchedVolunteer;
    } catch (error) {
      console.error("Service Layer Error updating Volunteer Name:", error);
      throw error;
    }
  }

  async delete(user: User, volunteerId: string): Promise<number[]> {
    try {
      const deletedCount = await this.volunteerRepository.delete(
        user,
        volunteerId
      );
      return deletedCount;
    } catch (error) {
      console.error("Service Layer Error deleting volunteer:", error);
      throw error;
    }
  }

  private transformDbVolunteerToSharedMetaData(
    items: DbVolunteerMetadata[] | DbVolunteerFull[]
  ): VolunteerMetadata[] {
    const volunteersMap = new Map<string, Partial<VolunteerMetadata>>();

    for (const item of items) {
      if (item.pK.startsWith("m")) continue;
      // this is an mp tr/pkg which we do not want to consider
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
      } else if (item.sK.startsWith("pkg")) {
        if (!volunteer.packages) volunteer.packages = [];
        const { pK, sK, entityType, ...rest } = item as DbPackage;
        volunteer.packages.push({
          id: sK,
          carerId: pK,
          ...rest,
        });
        continue;
      } else if (item.sK.startsWith("mag")) {
        continue;
      } else throw new Error(`Undefined Case: ${item}`);
    }

    return Array.from(volunteersMap.values()) as VolunteerMetadata[];
  }
}
