import { MagLog, magLogSchema } from "shared";
import { MagLogRepository } from "./repository";
import {
  DbMagLog,
  DbMagLogClient,
  DbMagLogEntity,
  DbMagLogMp,
  DbMagLogVolunteer,
} from "./schema";
import { addDbMiddleware } from "../service";

export class MagLogService {
  magLogRepository = new MagLogRepository();
  async getAll(user: User): Promise<MagLog[]> {
    try {
      const magLogs = await this.magLogRepository.getAll(user);
      const transformedResult = this.transformDbMagLogToShared(
        magLogs
      ) as MagLog[];
      const parsedResult = magLogSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all mag logs:", error);
      throw error;
    }
  }

  async getById(magLogId: string, user: User): Promise<MagLog> {
    try {
      const mag = await this.magLogRepository.getById(magLogId, user);
      const transformedResult = this.transformDbMagLogToShared(mag) as MagLog[];
      const parsedResult = magLogSchema.array().parse(transformedResult);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error getting mag log by ID:", error);
      throw error;
    }
  }

  async getByDateInterval(
    user: User,
    input: {
      startDate: string;
      endDate: string;
    }
  ): Promise<MagLog[]> {
    try {
      const mag = await this.magLogRepository.getByDateInterval(input, user);
      const transformedResult = this.transformDbMagLogToShared(mag) as MagLog[];
      const parsedResult = magLogSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting mag logs by date interval:",
        error
      );
      throw error;
    }
  }

  async create(newMagLog: Omit<MagLog, "id">, user: User): Promise<string> {
    try {
      const validatedInput = magLogSchema.omit({ id: true }).parse(newMagLog);

      const magLogMain: Omit<DbMagLogEntity, "pK" | "sK"> = addDbMiddleware(
        {
          ...validatedInput,
          entityType: "magLogEntity",
        },
        user
      );
      const magLogClients: Omit<DbMagLogClient, "sK">[] =
        validatedInput.clients.map((client) =>
          addDbMiddleware(
            {
              date: validatedInput.date,
              entityType: "magLogClient",
              entityOwner: "client",
              pK: client.id,
              ...client,
            },
            user
          )
        );
      const magLogMps: Omit<DbMagLogMp, "sK">[] = validatedInput.mps.map((mp) =>
        addDbMiddleware(
          {
            date: validatedInput.date,
            entityType: "magLogMp",
            entityOwner: "mp",
            pK: mp.id,
            ...mp,
          },
          user
        )
      );
      const magLogVolunteers: Omit<DbMagLogVolunteer, "sK">[] =
        validatedInput.volunteers.map((volunteer) =>
          addDbMiddleware(
            {
              date: validatedInput.date,
              entityType: "magLogVolunteer",
              entityOwner: "volunteer",
              pK: volunteer.id,
              ...volunteer,
            },
            user
          )
        );
      const createdLogId = await this.magLogRepository.createMagEntity(
        [magLogMain],
        user
      );
      await this.magLogRepository.createMagReference(
        createdLogId,
        [...magLogClients, ...magLogMps, ...magLogVolunteers],
        user
      );

      return createdLogId;
    } catch (error) {
      console.error("Service Layer Error creating magLogs:", error);
      throw error;
    }
  }

  async update(updatedMpLog: MagLog, user: User): Promise<void> {
    try {
      const validatedInput = magLogSchema.parse(updatedMpLog);
      const { id, clients, mps, volunteers, ...rest } = validatedInput;
      console.log(validatedInput);
      // delete all refs in case mps or volunteers purposely removed
      await this.magLogRepository.delete(id, user);

      const magLogMain: DbMagLogEntity = addDbMiddleware(
        {
          ...rest,
          pK: id,
          sK: id,
          entityType: "magLogEntity",
        },
        user
      );

      const magLogClients: DbMagLogClient[] = clients.map((client) =>
        addDbMiddleware(
          {
            pK: client.id,
            sK: id,
            entityType: "magLogClient",
            ...client,
          },
          user
        )
      );

      const magLogMps: DbMagLogMp[] = mps.map((mp) =>
        addDbMiddleware(
          {
            pK: mp.id,
            sK: id,
            entityType: "magLogMp",
            ...mp,
          },
          user
        )
      );

      const magLogVolunteers: DbMagLogVolunteer[] = volunteers.map(
        (volunteer) =>
          addDbMiddleware(
            {
              pK: volunteer.id,
              sK: id,
              entityType: "magLogVolunteer",
              ...volunteer,
            },
            user
          )
      );
      console.log(magLogMain, magLogClients, magLogMps, magLogVolunteers);
      await this.magLogRepository.update(
        [magLogMain, ...magLogClients, ...magLogMps, ...magLogVolunteers],
        user
      );
    } catch (error) {
      console.error("Service Layer Error updating magLogs:", error);
      throw error;
    }
  }

  async delete(user: User, magLogId: string): Promise<number> {
    try {
      const numDeleted = await this.magLogRepository.delete(magLogId, user);
      return numDeleted[0];
    } catch (error) {
      console.error("Service Layer Error deleting mag log:", error);
      throw error;
    }
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

      if (item.pK.startsWith("mag")) {
        // second check below as may not have any associated clients/mps/volunteers
        if (!magLog.clients) magLog.clients = [];
        if (!magLog.mps) magLog.mps = [];
        if (!magLog.volunteers) magLog.volunteers = [];
        const { pK, sK, entityType, ...rest } = item as DbMagLogEntity;
        Object.assign(magLog, rest);
        continue;
      } else if (item.pK.startsWith("c")) {
        if (!magLog.clients) magLog.clients = [];
        const { pK, sK, entityType, ...rest } = item as DbMagLogClient;
        magLog.clients.push({
          id: item.pK,
          ...rest,
        });
        continue;
      } else if (item.pK.startsWith("m")) {
        if (!magLog.mps) magLog.mps = [];
        const { pK, sK, entityType, ...rest } = item as DbMagLogMp;
        magLog.mps.push({
          id: item.pK,
          ...rest,
        });
      } else if (item.pK.startsWith("v")) {
        if (!magLog.volunteers) magLog.volunteers = [];
        const { pK, sK, entityType, ...rest } = item as DbMagLogVolunteer;
        magLog.volunteers.push({
          id: item.pK,
          ...rest,
        });
      } else throw new Error(`Undefined Case: ${item}`);
    }

    return Array.from(magLogsMap.values()) as MagLog[];
  }
}
