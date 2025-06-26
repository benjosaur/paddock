import { MpFull, mpFullSchema, MpMetadata, mpMetadataSchema } from "shared";
import { MpRepository } from "./repository";
import { DbMpFull, DbMpMetadata } from "./schema";
import { MpLogService } from "../mplog/service";

export class MpService {
  mpRepository = new MpRepository();
  mpLogService = new MpLogService();
  async getAll(): Promise<MpMetadata[]> {
    const mps = await this.mpRepository.getAll();
    const transformedResult = this.transformDbMpToSharedMetaData(
      mps
    ) as MpMetadata[];
    const parsedResult = mpMetadataSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(mpId: string): Promise<MpFull> {
    const mp = await this.mpRepository.getById(mpId);
    const mpLogIds = mp
      .filter((dbResult) => dbResult.entityType == "mpLog")
      .map((mpLog) => mpLog.sK);
    const mpLogs = await Promise.all(
      mpLogIds.map(async (mpLogId) => await this.mpLogService.getById(mpLogId))
    );
    const mpMetadata = this.transformDbMpToSharedMetaData(mp);
    const fullMp: MpFull[] = [{ ...mpMetadata[0], mpLogs }];
    const parsedResult = mpFullSchema.array().parse(fullMp);
    return parsedResult[0];
  }

  private transformDbMpToSharedMetaData(
    items: DbMpMetadata[] | DbMpFull[]
  ): MpMetadata[] {
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
        case "trainingRecord":
          if (!mp.trainingRecords) mp.trainingRecords = [];
          mp.trainingRecords.push({
            id: item.sK,
            owner: "mp",
            recordName: item.recordName,
            recordExpiry: item.recordExpiry,
          });
          break;
        case "mpLog":
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }

    return Array.from(mpsMap.values()) as MpMetadata[] | MpFull[];
  }
}
