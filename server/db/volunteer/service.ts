import {
  VolunteerFull,
  volunteerFullSchema,
  VolunteerMetadata,
  volunteerMetadataSchema,
} from "shared";
import { VolunteerRepository } from "./repository";
import { DbVolunteerFull, DbVolunteerMetadata } from "./schema";
import { VolunteerLogService } from "../vlog/service";

export class VolunteerService {
  volunteerRepository = new VolunteerRepository();
  volunteerLogService = new VolunteerLogService();

  async getAll(): Promise<VolunteerMetadata[]> {
    const volunteers = await this.volunteerRepository.getAll();
    const transformedResult = this.transformDbVolunteertoSharedMetaData(
      volunteers
    ) as VolunteerMetadata[];
    const parsedResult = volunteerMetadataSchema
      .array()
      .parse(transformedResult);
    return parsedResult;
  }

  async getById(volunteerId: string): Promise<VolunteerFull> {
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
