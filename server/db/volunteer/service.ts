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
} from "./schema";
import { TrainingRecordService } from "../training/service";
import { TrainingRecordRepository } from "../training/repository";
import { DbTrainingRecord } from "../training/schema";
import { DbPackage } from "../package/schema";
import { PackageService } from "../package/service";
import { PackageRepository } from "../package/repository";
import { RequestService } from "../requests/service";
import { genericUpdate } from "../repository";

export class VolunteerService {
  volunteerRepository = new VolunteerRepository();
  packageService = new PackageService();
  requestService = new RequestService();
  trainingRecordService = new TrainingRecordService();
  packageRepository = new PackageRepository();
  trainingRecordRepository = new TrainingRecordRepository();

  async getAllNotArchived(user: User): Promise<VolunteerMetadata[]> {
    try {
      const dbVolunteers = await this.volunteerRepository.getAllNotArchived(
        user
      );
      const dbTrainingRecords =
        await this.trainingRecordRepository.getAllNotArchived(user);
      const dbPackages = await this.packageRepository.getAllNotArchived(user);
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
  ): Promise<string> {
    // not for packages
    try {
      const validatedInput = volunteerMetadataSchema
        .omit({ id: true })
        .parse(newVolunteer);

      const volunteerToCreate: Omit<DbVolunteerEntity, "pK" | "sK"> = {
        ...validatedInput,
        entityType: "volunteer",
      };
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
      const dbVolunteer: DbVolunteerEntity = {
        pK: id,
        sK: id,
        entityType: "volunteer",
        ...rest,
      };
      await this.volunteerRepository.update(dbVolunteer, user);
    } catch (error) {
      console.error("Service Layer Error updating MP:", error);
      throw error;
    }
  }

  async updateName(
    volunteerId: string,
    newName: string,
    user: User
  ): Promise<void> {
    try {
      const initialVolunteerRecords = await this.volunteerRepository.getById(
        volunteerId,
        user
      );
      const updatedVolunteerRecords = initialVolunteerRecords.map((record) => ({
        ...record,
        details: { ...record.details, name: newName },
      }));
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
