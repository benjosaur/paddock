import { MagLog, magLogSchema } from "shared";
import { MagLogRepository } from "./repository";
import { DbMagLog } from "./schema";

export class MagLogService {
  magLogRepository = new MagLogRepository();
  async getAll(): Promise<MagLog[]> {
    const magLogs = await this.magLogRepository.getAll();
    const transformedResult = this.transformDbMagLogToShared(
      magLogs
    ) as MagLog[];
    const parsedResult = magLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(magLogId: string): Promise<MagLog> {
    const mag = await this.magLogRepository.getById(magLogId);
    const transformedResult = this.transformDbMagLogToShared(mag) as MagLog[];
    const parsedResult = magLogSchema.array().parse(transformedResult);
    return parsedResult[0];
  }

  async getByDateInterval(input: {
    startDate: string;
    endDate: string;
  }): Promise<MagLog[]> {
    const mag = await this.magLogRepository.getByDateInterval(input);
    const transformedResult = this.transformDbMagLogToShared(mag) as MagLog[];
    const parsedResult = magLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  private transformDbMagLogToShared(items: DbMagLog[]): MagLog[] {
    const magLogsMap = new Map<string, Partial<MagLog>>();

    for (const item of items) {
      const magLogId = item.sK;

      if (!magLogsMap.has(magLogId)) {
        magLogsMap.set(magLogId, {
          id: magLogId,
        });
      }

      const magLog = magLogsMap.get(magLogId)!;

      switch (item.entityOwner) {
        case "main":
          magLog.date = item.date;
          magLog.details = item.details;
          break;
        case "client":
          if (!magLog.clients) magLog.clients = [];
          magLog.clients.push({
            id: item.pK,
            details: item.details,
          });
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }
    return Array.from(magLogsMap.values()) as MagLog[];
  }
}
