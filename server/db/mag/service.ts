import { MagLog, magLogSchema } from "shared";
import { MagLogRepository } from "./repository";
import { dbMagLog, DbMagLog, DbMagLogClient, DbMagLogEntity } from "./schema";

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

  async create(newMagLog: Omit<MagLog, "id">, userId: string): Promise<MagLog> {
    const magLogMain: Omit<DbMagLogEntity, "pK" | "sK"> = {
      ...newMagLog,
      entityType: "magLog",
      entityOwner: "main",
    };
    const magLogClients: Omit<DbMagLogClient, "sK">[] = newMagLog.clients.map(
      (client) => ({
        date: newMagLog.date,
        entityType: "magLog",
        entityOwner: "client",
        pK: client.id,
        ...client,
      })
    );
    try {
      const validatedLogs = dbMagLog
        .array()
        .parse([magLogMain, ...magLogClients]);
      const createdLogId = await this.magLogRepository.create(
        validatedLogs,
        userId
      );

      const fetchedLog = await this.getById(createdLogId);
      if (!fetchedLog) {
        throw new Error("Failed to fetch created mag log");
      }

      const { id, ...restFetched } = fetchedLog;

      if (JSON.stringify(newMagLog) !== JSON.stringify(restFetched)) {
        throw new Error("Created mag log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error creating magLogs:", error);
      throw error;
    }
  }

  async update(updatedMpLog: MagLog, userId: string): Promise<MagLog> {
    const magLogKey = updatedMpLog.id;
    const magLogMain: DbMagLogEntity = {
      ...updatedMpLog,
      pK: magLogKey,
      sK: magLogKey,
      entityType: "magLog",
      entityOwner: "main",
    };
    const magLogClients: DbMagLogClient[] = updatedMpLog.clients.map(
      (client) => ({
        pK: client.id,
        sK: magLogKey,
        date: updatedMpLog.date,
        entityType: "magLog",
        entityOwner: "client",
        ...client,
      })
    );
    try {
      const validatedLogs = dbMagLog
        .array()
        .parse([magLogMain, ...magLogClients]);
      await this.magLogRepository.update(validatedLogs, userId);

      const fetchedLog = await this.getById(updatedMpLog.id);
      if (!fetchedLog) {
        throw new Error("Failed to fetch updated mag log");
      }

      if (JSON.stringify(updatedMpLog) !== JSON.stringify(fetchedLog)) {
        throw new Error("Updated mag log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error updating magLogs:", error);
      throw error;
    }
  }

  async delete(magLogId: string): Promise<number> {
    const numDeleted = await this.magLogRepository.delete(magLogId);
    return numDeleted[0];
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
