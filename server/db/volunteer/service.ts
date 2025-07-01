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
import { VolunteerLogService } from "../vlog/service";
import { TrainingRecordService } from "../training/service";
import assert from "assert";

export class VolunteerService {
  volunteerRepository = new VolunteerRepository();
  volunteerLogService = new VolunteerLogService();
  trainingRecordService = new TrainingRecordService();

  async getAll(): Promise<VolunteerMetadata[]> {
    try {
      const volunteers = await this.volunteerRepository.getAll();
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

  async getById(volunteerId: string): Promise<VolunteerFull> {
    try {
      const volunteer = await this.volunteerRepository.getById(volunteerId);
      const volunteerLogIds = volunteer
        .filter((dbResult) => dbResult.entityType == "volunteerLog")
        .map((volunteerLog) => volunteerLog.sK);
      const volunteerLogs = await Promise.all(
        volunteerLogIds.map(
          async (volunteerLogId) =>
            await this.volunteerLogService.getById(volunteerLogId)
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
    newVolunteer: Omit<VolunteerMetadata, "id">
  ): Promise<VolunteerFull> {
    try {
      const volunteerToCreate: Omit<DbVolunteerEntity, "id" | "pK" | "sK"> = {
        ...newVolunteer,
        entityType: "volunteer",
        entityOwner: "volunteer",
      };
      const createdVolunteer = await this.volunteerRepository.create(
        volunteerToCreate
      );
      // TODO: add any training records
      const transformedVolunteer =
        this.transformDbVolunteertoSharedMetaData(createdVolunteer);
      const parsedResult = volunteerFullSchema
        .array()
        .parse(transformedVolunteer);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error creating volunteer:", error);
      throw error;
    }
  }

  async update(updatedVolunteer: VolunteerMetadata): Promise<VolunteerFull> {
    try {
      const dbVolunteer: DbVolunteerEntity = {
        pK: updatedVolunteer.id,
        sK: updatedVolunteer.id,
        entityType: "volunteer",
        entityOwner: "volunteer",
        dateOfBirth: updatedVolunteer.dateOfBirth,
        postCode: updatedVolunteer.postCode,
        recordName: updatedVolunteer.recordName,
        recordExpiry: updatedVolunteer.recordExpiry,
        details: updatedVolunteer.details,
      };

      await this.volunteerRepository.update(dbVolunteer);
      const fetchedVolunteer = await this.getById(updatedVolunteer.id);
      return fetchedVolunteer;
    } catch (error) {
      console.error("Service Layer Error updating volunteer:", error);
      throw error;
    }
  }

  async updateName(updatedVolunteer: VolunteerFull): Promise<VolunteerFull> {
    try {
      await this.update(updatedVolunteer);
      await Promise.all(
        updatedVolunteer.trainingRecords.map((record) =>
          this.trainingRecordService.update(
            updatedVolunteer.id,
            updatedVolunteer.details.name,
            record
          )
        )
      );
      await Promise.all(
        updatedVolunteer.volunteerLogs.map((log) =>
          this.volunteerLogService.update(log)
        )
      );
      const fetchedVolunteer = await this.getById(updatedVolunteer.id);
      const parsedResult = volunteerFullSchema.parse(fetchedVolunteer);
      assert.deepStrictEqual(updatedVolunteer, parsedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error updating Volunteer Name:", error);
      throw error;
    }
  }

  async delete(volunteerId: string): Promise<number[]> {
    try {
      const deletedCount = await this.volunteerRepository.delete(volunteerId);
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
            owner: "volunteer",
            recordName: item.recordName,
            recordExpiry: item.recordExpiry,
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
