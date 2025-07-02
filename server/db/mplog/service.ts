import { MpLog, mpLogSchema } from "shared";
import { MpLogRepository } from "./repository";
import {
  dbMpLog,
  DbMpLog,
  DbMpLogClient,
  DbMpLogEntity,
  DbMpLogMp,
} from "./schema";

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

  async getById(mpLogId: string): Promise<MpLog> {
    const mp = await this.mpLogRepository.getById(mpLogId);
    const transformedResult = this.groupAndTransformMpLogData(mp) as MpLog[];
    const parsedResult = mpLogSchema.array().parse(transformedResult);
    return parsedResult[0];
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

  async getByDateInterval(input: {
    startDate: string;
    endDate: string;
  }): Promise<MpLog[]> {
    const mag = await this.mpLogRepository.getByDateInterval(input);
    const transformedResult = this.groupAndTransformMpLogData(mag) as MpLog[];
    const parsedResult = mpLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async create(newMpLog: Omit<MpLog, "id">, userId: string): Promise<MpLog> {
    const mpLogMain: Omit<DbMpLogEntity, "pK" | "sK"> = {
      ...newMpLog,
      entityType: "mpLog",
      entityOwner: "main",
    };
    const mpLogMps: Omit<DbMpLogMp, "sK">[] = newMpLog.mps.map((mp) => ({
      date: newMpLog.date,
      entityType: "mpLog",
      entityOwner: "mp",
      pK: mp.id,
      ...mp,
    }));
    const mpLogClients: Omit<DbMpLogClient, "sK">[] = newMpLog.clients.map(
      (client) => ({
        date: newMpLog.date,
        entityType: "mpLog",
        entityOwner: "client",
        pK: client.id,
        ...client,
      })
    );
    try {
      const validatedLogs = dbMpLog
        .array()
        .parse([mpLogMain, ...mpLogMps, ...mpLogClients]);
      const createdLogId = await this.mpLogRepository.create(
        validatedLogs,
        userId
      );

      const fetchedLog = await this.getById(createdLogId);
      if (!fetchedLog) {
        throw new Error("Failed to fetch created mp log");
      }

      const { id, ...restFetched } = fetchedLog;

      if (JSON.stringify(newMpLog) !== JSON.stringify(restFetched)) {
        throw new Error("Created mp log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error creating mpLogs:", error);
      throw error;
    }
  }

  async update(updatedMpLog: MpLog, userId: string): Promise<MpLog> {
    const mpLogKey = updatedMpLog.id;
    const mpLogMain: DbMpLogEntity = {
      ...updatedMpLog,
      pK: mpLogKey,
      sK: mpLogKey,
      entityType: "mpLog",
      entityOwner: "main",
    };
    const mpLogMps: DbMpLogMp[] = updatedMpLog.mps.map((mp) => ({
      pK: mp.id,
      sK: mpLogKey,
      date: updatedMpLog.date,
      entityType: "mpLog",
      entityOwner: "mp",
      ...mp,
    }));
    const mpLogClients: DbMpLogClient[] = updatedMpLog.clients.map(
      (client) => ({
        pK: client.id,
        sK: mpLogKey,
        date: updatedMpLog.date,
        entityType: "mpLog",
        entityOwner: "client",
        ...client,
      })
    );
    try {
      const validatedLogs = dbMpLog
        .array()
        .parse([mpLogMain, ...mpLogMps, ...mpLogClients]);
      await this.mpLogRepository.update(validatedLogs, userId);

      const fetchedLog = await this.getById(updatedMpLog.id);
      if (!fetchedLog) {
        throw new Error("Failed to fetch updated mp log");
      }

      if (JSON.stringify(updatedMpLog) !== JSON.stringify(fetchedLog)) {
        throw new Error("Updated mp log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error updating mpLogs:", error);
      throw error;
    }
  }

  async delete(mpLogId: string): Promise<number> {
    const numDeleted = await this.mpLogRepository.delete(mpLogId);
    return numDeleted[0];
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
