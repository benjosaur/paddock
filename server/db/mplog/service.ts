import { MpLog, mpLogSchema } from "shared";
import { MpLogRepository } from "./repository";
import { DbMpLog } from "./schema";

export class MpLogService {
  mpLogRepository = new MpLogRepository();
  async getAll(): Promise<MpLog[]> {
    const mpLogs = await this.mpLogRepository.getAll();
    const transformedResult = this.groupAndTransformMpLogData(
      mpLogs
    ) as MpLog[];
    const parsedResult = mpLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(mpLogId: string): Promise<MpLog[]> {
    const mp = await this.mpLogRepository.getById(mpLogId);
    const transformedResult = this.groupAndTransformMpLogData(mp) as MpLog[];
    const parsedResult = mpLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getBySubstring(string: string): Promise<MpLog[]> {
    const metaLogs = await this.mpLogRepository.getMetaLogsBySubstring(string);
    const idsToFetch = metaLogs.map((log) => log.sK);
    const parsedResult: MpLog[] = [];
    for (const id of idsToFetch) {
      const fetchedLog = await this.mpLogRepository.getById(id);
      const parsedLog = this.groupAndTransformMpLogData(fetchedLog);
      parsedResult.push(parsedLog[0]);
    }
    return parsedResult;
  }

  async getByMpId(mpId: string): Promise<MpLog[]> {
    const metaLogs = await this.mpLogRepository.getMetaLogsByMpId(mpId);
    const idsToFetch = metaLogs.map((log) => log.sK);
    const parsedResult: MpLog[] = [];
    for (const id of idsToFetch) {
      const fetchedLog = await this.mpLogRepository.getById(id);
      const parsedLog = this.groupAndTransformMpLogData(fetchedLog);
      parsedResult.push(parsedLog[0]);
    }
    return parsedResult;
  }

  private groupAndTransformMpLogData(items: DbMpLog[]): MpLog[] {
    const mpLogsMap = new Map<string, Partial<MpLog>>();

    for (const item of items) {
      // nb id is sK not pK
      const mpLogId = item.sK;

      if (!mpLogsMap.has(mpLogId)) {
        mpLogsMap.set(mpLogId, {
          id: mpLogId,
        });
      }

      const mpLog = mpLogsMap.get(mpLogId)!;

      switch (item.entityOwner) {
        case "main":
          mpLog.date = item.date;
          mpLog.details = item.details;
          break;
        case "mp":
          if (!mpLog.mps) mpLog.mps = [];
          mpLog.mps.push({
            id: item.pK,
            details: item.details,
          });
          break;
        case "client":
          if (!mpLog.clients) mpLog.clients = [];
          mpLog.clients.push({
            id: item.pK,
            postCode: item.postCode,
            details: item.details,
          });
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }
    return Array.from(mpLogsMap.values()) as MpLog[];
  }
}
