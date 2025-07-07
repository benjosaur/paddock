import { MagLog, magLogSchema } from "shared";
import { MagLogRepository } from "./repository";
import { DbMagLog, DbMagLogClient, DbMagLogEntity } from "./schema";

export class MagLogService {
  magLogRepository = new MagLogRepository();
  async getAll(user: User): Promise<MagLog[]> {
    const magLogs = await this.magLogRepository.getAll(user);
    const transformedResult = this.transformDbMagLogToShared(
      magLogs
    ) as MagLog[];
    const parsedResult = magLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(user: User, magLogId: string): Promise<MagLog> {
    const mag = await this.magLogRepository.getById(user, magLogId);
    const transformedResult = this.transformDbMagLogToShared(mag) as MagLog[];
    const parsedResult = magLogSchema.array().parse(transformedResult);
    return parsedResult[0];
  }

  async getByDateInterval(
    user: User,
    input: {
      startDate: string;
      endDate: string;
    }
  ): Promise<MagLog[]> {
    const mag = await this.magLogRepository.getByDateInterval(user, input);
    const transformedResult = this.transformDbMagLogToShared(mag) as MagLog[];
    const parsedResult = magLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async create(newMagLog: Omit<MagLog, "id">, user: User): Promise<MagLog> {
    const validatedInput = magLogSchema.omit({ id: true }).parse(newMagLog);

    const magLogMain: Omit<DbMagLogEntity, "pK" | "sK"> = {
      ...validatedInput,
      entityType: "magLog",
      entityOwner: "main",
    };
    const magLogClients: Omit<DbMagLogClient, "sK">[] =
      validatedInput.clients.map((client) => ({
        date: validatedInput.date,
        entityType: "magLog",
        entityOwner: "client",
        pK: client.id,
        ...client,
      }));
    try {
      const createdLogId = await this.magLogRepository.create(
        [magLogMain, ...magLogClients],
        user
      );

      const fetchedLog = await this.getById(user, createdLogId);
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

  async update(updatedMpLog: MagLog, user: User): Promise<MagLog> {
    const validatedInput = magLogSchema.parse(updatedMpLog);
    const magLogKey = validatedInput.id;

    const magLogMain: DbMagLogEntity = {
      ...validatedInput,
      pK: magLogKey,
      sK: magLogKey,
      entityType: "magLog",
      entityOwner: "main",
    };
    const magLogClients: DbMagLogClient[] = validatedInput.clients.map(
      (client) => ({
        pK: client.id,
        sK: magLogKey,
        date: validatedInput.date,
        entityType: "magLog",
        entityOwner: "client",
        ...client,
      })
    );
    try {
      await this.magLogRepository.update([magLogMain, ...magLogClients], user);

      const fetchedLog = await this.getById(user, updatedMpLog.id);
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

  async delete(user: User, magLogId: string): Promise<number> {
    const numDeleted = await this.magLogRepository.delete(user, magLogId);
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
