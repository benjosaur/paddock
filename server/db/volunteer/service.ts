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

export class VolunteerService {
  volunteerRepository = new VolunteerRepository();
  volunteerLogService = new VolunteerLogService();
  trainingRecordService = new TrainingRecordService();
  volunteerLogRepository = new VolunteerLogRepository();
  trainingRecordRepository = new TrainingRecordRepository();

  async getAll(user: User): Promise<VolunteerMetadata[]> {
    try {
      const volunteers = await this.volunteerRepository.getAll(user);
      const transformedResult = this.transformDbVolunteertoSharedMetaData(
        volunteers
      ) as VolunteerMetadata[];
      const parsedResult = volunteerMetadataSchema
        .array()
        .parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all volunteers:", error);
      throw error;
    }
  }

  async getById(user: User, volunteerId: string): Promise<VolunteerFull> {
    try {
      const volunteer = await this.volunteerRepository.getById(
        user,
        volunteerId
      );
      const volunteerLogIds = volunteer
        .filter((dbResult) => dbResult.entityType == "volunteerLog")
        .map((volunteerLog) => volunteerLog.sK);
      const volunteerLogs = await Promise.all(
        volunteerLogIds.map(
          async (volunteerLogId) =>
            await this.volunteerLogService.getById(user, volunteerLogId)
        )
      );
      const volunteerMetadata =
        this.transformDbVolunteertoSharedMetaData(volunteer);
      const volunteerFull: VolunteerFull[] = [
        { ...volunteerMetadata[0], volunteerLogs },
      ];
      const parsedResult = volunteerFullSchema.array().parse(volunteerFull);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error getting volunteer by ID:", error);
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

  private transformDbVolunteertoSharedMetaData(
    items: DbVolunteerMetadata[] | DbVolunteerFull[]
  ): VolunteerMetadata[] {
    const volunteersMap = new Map<string, Partial<VolunteerFull>>();

    for (const item of items) {
      const volunteerId = item.pK;

      if (!volunteersMap.has(volunteerId)) {
        volunteersMap.set(volunteerId, {
          id: volunteerId,
        });
      }

      const volunteer = volunteersMap.get(volunteerId)!;

      switch (item.entityType) {
        case "volunteer":
          volunteer.dateOfBirth = item.dateOfBirth;
          volunteer.postCode = item.postCode;
          volunteer.details = item.details;
          volunteer.recordName = item.recordName;
          volunteer.recordExpiry = item.recordExpiry;
          break;
        case "trainingRecord":
          if (!volunteer.trainingRecords) volunteer.trainingRecords = [];
          volunteer.trainingRecords.push({
            id: item.sK,
            ownerId: item.pK,
            recordName: item.recordName,
            recordExpiry: item.recordExpiry,
            details: item.details,
          });
          break;
        case "volunteerLog":
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }

    return Array.from(volunteersMap.values()) as VolunteerMetadata[];
  }
}
