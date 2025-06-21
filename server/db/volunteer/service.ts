import {
  VolunteerFull,
  volunteerFullSchema,
  VolunteerMetadata,
  mpMetadataSchema,
} from "shared";
import { VolunteerRepository } from "./repository";
import { DbVolunteerFull, DbVolunteerMetadata } from "./schema";

export class VolunteerService {
  mpRepository = new VolunteerRepository();
  async getAll(): Promise<VolunteerMetadata[]> {
    const mps = await this.mpRepository.getAll();
    const transformedResult = this.groupAndTransformVolunteerData(
      mps
    ) as VolunteerMetadata[];
    const parsedResult = mpMetadataSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(mpId: string): Promise<VolunteerFull[]> {
    const mp = await this.mpRepository.getById(mpId);
    const transformedResult = this.groupAndTransformVolunteerData(
      mp
    ) as VolunteerFull[];
    const parsedResult = volunteerFullSchema.array().parse(transformedResult);
    return parsedResult;
  }

  private groupAndTransformVolunteerData(
    items: DbVolunteerMetadata[] | DbVolunteerFull[]
  ): VolunteerMetadata[] | VolunteerFull[] {
    const mpsMap = new Map<string, Partial<VolunteerFull>>();

    for (const item of items) {
      const mpId = item.pK;

      if (!mpsMap.has(mpId)) {
        mpsMap.set(mpId, {
          id: mpId,
        });
      }

      const mp = mpsMap.get(mpId)!;

      switch (item.entityType) {
        case "volunteer":
          mp.dateOfBirth = item.dateOfBirth;
          mp.postCode = item.postCode;
          mp.details = item.details;
          mp.recordName = item.recordName;
          mp.recordExpiry = item.recordExpiry;
          break;
        case "volunteerLog":
          if (!mp.mpLogs) mp.mpLogs = [];
          mp.mpLogs.push({
            id: item.sK,
            date: item.date,
            details: {
              notes: item.details.notes,
            },
          });
          break;
        case "trainingRecord":
          if (!mp.trainingRecords) mp.trainingRecords = [];
          mp.trainingRecords.push({
            id: item.sK,
            recordName: item.recordName,
            recordExpiry: item.recordExpiry,
          });
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }

    return Array.from(mpsMap.values()) as VolunteerMetadata[] | VolunteerFull[];
  }
}
