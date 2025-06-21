import { MpFull, mpFullSchema, MpMetadata, mpMetadataSchema } from "shared";
import { MpRepository } from "./repository";
import { DbMpFull, DbMpMetadata } from "./schema";

export class MpService {
  mpRepository = new MpRepository();
  async getAll(): Promise<MpMetadata[]> {
    const mps = await this.mpRepository.getAll();
    const transformedResult = this.groupAndTransformMpData(mps) as MpMetadata[];
    const parsedResult = mpMetadataSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(mpId: string): Promise<MpFull[]> {
    const mp = await this.mpRepository.getById(mpId);
    const transformedResult = this.groupAndTransformMpData(mp) as MpFull[];
    const parsedResult = mpFullSchema.array().parse(transformedResult);
    return parsedResult;
  }

  private groupAndTransformMpData(
    items: DbMpMetadata[] | DbMpFull[]
  ): MpMetadata[] | MpFull[] {
    const mpsMap = new Map<string, Partial<MpFull>>();

    for (const item of items) {
      const mpId = item.pK;

      if (!mpsMap.has(mpId)) {
        mpsMap.set(mpId, {
          id: mpId,
        });
      }

      const mp = mpsMap.get(mpId)!;

      switch (item.entityType) {
        case "mp":
          mp.dateOfBirth = item.dateOfBirth;
          mp.postCode = item.postCode;
          mp.details = item.details;
          mp.recordName = item.recordName;
          mp.recordExpiry = item.recordExpiry;
          break;
        case "mpLog":
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

    return Array.from(mpsMap.values()) as MpMetadata[] | MpFull[];
  }
}
