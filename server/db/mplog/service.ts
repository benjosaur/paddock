import { MpLog, mpLogSchema } from "shared";
import { MpLogRepository } from "./repository";
import { DbMpLog, DbMpLogClient, DbMpLogEntity, DbMpLogMp } from "./schema";

export class MpLogService {
  mpLogRepository = new MpLogRepository();
  async getAll(user: User): Promise<MpLog[]> {
    const mpLogs = await this.mpLogRepository.getAll(user);
    const transformedResult = this.groupAndTransformMpLogData(
      mpLogs
    ) as MpLog[];
    const parsedResult = mpLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(user: User, mpLogId: string): Promise<MpLog> {
    const mp = await this.mpLogRepository.getById(user, mpLogId);
    const transformedResult = this.groupAndTransformMpLogData(mp) as MpLog[];
    const parsedResult = mpLogSchema.array().parse(transformedResult);
    return parsedResult[0];
  }

  async getBySubstring(user: User, string: string): Promise<MpLog[]> {
    const metaLogs = await this.mpLogRepository.getMetaLogsBySubstring(
      user,
      string
    );
    const idsToFetch = metaLogs.map((log) => log.sK);
    const parsedResult: MpLog[] = [];
    for (const id of idsToFetch) {
      const fetchedLog = await this.mpLogRepository.getById(user, id);
      const parsedLog = this.groupAndTransformMpLogData(fetchedLog);
      parsedResult.push(parsedLog[0]);
    }
    return parsedResult;
  }

  async getByMpId(user: User, mpId: string): Promise<MpLog[]> {
    const metaLogs = await this.mpLogRepository.getMetaLogsByMpId(user, mpId);
    const idsToFetch = metaLogs.map((log) => log.sK);
    const parsedResult: MpLog[] = [];
    for (const id of idsToFetch) {
      const fetchedLog = await this.mpLogRepository.getById(user, id);
      const parsedLog = this.groupAndTransformMpLogData(fetchedLog);
      parsedResult.push(parsedLog[0]);
    }
    return parsedResult;
  }

  async getByDateInterval(
    user: User,
    input: {
      startDate: string;
      endDate: string;
    }
  ): Promise<MpLog[]> {
    const mag = await this.mpLogRepository.getByDateInterval(user, input);
    const transformedResult = this.groupAndTransformMpLogData(mag) as MpLog[];
    const parsedResult = mpLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async create(newMpLog: Omit<MpLog, "id">, user: User): Promise<MpLog> {
    const validatedInput = mpLogSchema.omit({ id: true }).parse(newMpLog);

    const mpLogMain: Omit<DbMpLogEntity, "pK" | "sK"> = {
      ...validatedInput,
      entityType: "mpLog",
      entityOwner: "main",
    };
    const mpLogMps: Omit<DbMpLogMp, "sK">[] = validatedInput.mps.map((mp) => ({
      date: validatedInput.date,
      entityType: "mpLog",
      entityOwner: "mp",
      pK: mp.id,
      ...mp,
    }));
    const mpLogClients: Omit<DbMpLogClient, "sK">[] =
      validatedInput.clients.map((client) => ({
        date: validatedInput.date,
        entityType: "mpLog",
        entityOwner: "client",
        pK: client.id,
        ...client,
      }));
    try {
      const createdLogId = await this.mpLogRepository.create(
        [mpLogMain, ...mpLogMps, ...mpLogClients],
        user
      );

      const fetchedLog = await this.getById(user, createdLogId);
      if (!fetchedLog) {
        throw new Error("Failed to fetch created mp log");
      }

      const { id, ...restFetched } = fetchedLog;

      if (JSON.stringify(validatedInput) !== JSON.stringify(restFetched)) {
        throw new Error("Created mp log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error creating mpLogs:", error);
      throw error;
    }
  }

  async update(updatedMpLog: MpLog, user: User): Promise<MpLog> {
    const validatedInput = mpLogSchema.parse(updatedMpLog);
    const mpLogKey = validatedInput.id;

    const mpLogMain: DbMpLogEntity = {
      ...validatedInput,
      pK: mpLogKey,
      sK: mpLogKey,
      entityType: "mpLog",
      entityOwner: "main",
    };
    const mpLogMps: DbMpLogMp[] = validatedInput.mps.map((mp) => ({
      pK: mp.id,
      sK: mpLogKey,
      date: validatedInput.date,
      entityType: "mpLog",
      entityOwner: "mp",
      ...mp,
    }));
    const mpLogClients: DbMpLogClient[] = validatedInput.clients.map(
      (client) => ({
        pK: client.id,
        sK: mpLogKey,
        date: validatedInput.date,
        entityType: "mpLog",
        entityOwner: "client",
        ...client,
      })
    );
    try {
      await this.mpLogRepository.update(
        [mpLogMain, ...mpLogMps, ...mpLogClients],
        user
      );

      const fetchedLog = await this.getById(user, updatedMpLog.id);
      if (!fetchedLog) {
        throw new Error("Failed to fetch updated mp log");
      }

      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedLog)) {
        throw new Error("Updated mp log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error updating mpLogs:", error);
      throw error;
    }
  }

  async delete(user: User, mpLogId: string): Promise<number> {
    const numDeleted = await this.mpLogRepository.delete(user, mpLogId);
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
