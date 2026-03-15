import { HubGrubLog, hubGrubLogSchema } from "shared";
import { HubGrubLogRepository } from "./repository";
import {
  DbHubGrubLog,
  DbHubGrubLogClient,
  DbHubGrubLogEntity,
  DbHubGrubLogMp,
  DbHubGrubLogVolunteer,
} from "./schema";
import { addDbMiddleware } from "../service";

export class HubGrubLogService {
  hubGrubLogRepository = new HubGrubLogRepository();

  async getAll(user: User): Promise<HubGrubLog[]> {
    try {
      const hubGrubLogs = await this.hubGrubLogRepository.getAll(user);
      const transformedResult = this.transformDbHubGrubLogToShared(
        hubGrubLogs
      ) as HubGrubLog[];
      const parsedResult = hubGrubLogSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all hub & grub logs:", error);
      throw error;
    }
  }

  async getById(hubGrubLogId: string, user: User): Promise<HubGrubLog> {
    try {
      const hubGrubLog = await this.hubGrubLogRepository.getById(hubGrubLogId, user);
      const transformedResult = this.transformDbHubGrubLogToShared(hubGrubLog) as HubGrubLog[];
      const parsedResult = hubGrubLogSchema.array().parse(transformedResult);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error getting hub & grub log by ID:", error);
      throw error;
    }
  }

  async getByDateInterval(
    user: User,
    input: {
      startDate: string;
      endDate: string;
    }
  ): Promise<HubGrubLog[]> {
    try {
      const hubGrubLog = await this.hubGrubLogRepository.getByDateInterval(input, user);
      const transformedResult = this.transformDbHubGrubLogToShared(hubGrubLog) as HubGrubLog[];
      const parsedResult = hubGrubLogSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting hub & grub logs by date interval:",
        error
      );
      throw error;
    }
  }

  async create(newHubGrubLog: Omit<HubGrubLog, "id">, user: User): Promise<string> {
    try {
      const validatedInput = hubGrubLogSchema.omit({ id: true }).parse(newHubGrubLog);

      const hubGrubLogMain: Omit<DbHubGrubLogEntity, "pK" | "sK"> = addDbMiddleware(
        {
          ...validatedInput,
          entityType: "hubGrubLogEntity",
        },
        user
      );
      const hubGrubLogClients: Omit<DbHubGrubLogClient, "sK">[] =
        validatedInput.clients.map((client) =>
          addDbMiddleware(
            {
              date: validatedInput.date,
              entityType: "hubGrubLogClient",
              entityOwner: "client",
              pK: client.id,
              ...client,
            },
            user
          )
        );
      const hubGrubLogMps: Omit<DbHubGrubLogMp, "sK">[] = validatedInput.mps.map((mp) =>
        addDbMiddleware(
          {
            date: validatedInput.date,
            entityType: "hubGrubLogMp",
            entityOwner: "mp",
            pK: mp.id,
            ...mp,
          },
          user
        )
      );
      const hubGrubLogVolunteers: Omit<DbHubGrubLogVolunteer, "sK">[] =
        validatedInput.volunteers.map((volunteer) =>
          addDbMiddleware(
            {
              date: validatedInput.date,
              entityType: "hubGrubLogVolunteer",
              entityOwner: "volunteer",
              pK: volunteer.id,
              ...volunteer,
            },
            user
          )
        );
      const createdLogId = await this.hubGrubLogRepository.createHubGrubEntity(
        [hubGrubLogMain],
        user
      );
      await this.hubGrubLogRepository.createHubGrubReference(
        createdLogId,
        [...hubGrubLogClients, ...hubGrubLogMps, ...hubGrubLogVolunteers],
        user
      );

      return createdLogId;
    } catch (error) {
      console.error("Service Layer Error creating hub & grub logs:", error);
      throw error;
    }
  }

  async update(updatedHubGrubLog: HubGrubLog, user: User): Promise<void> {
    try {
      const validatedInput = hubGrubLogSchema.parse(updatedHubGrubLog);
      const { id, clients, mps, volunteers, ...rest } = validatedInput;

      await this.hubGrubLogRepository.delete(id, user);

      const hubGrubLogMain: DbHubGrubLogEntity = addDbMiddleware(
        {
          ...rest,
          pK: id,
          sK: id,
          entityType: "hubGrubLogEntity",
        },
        user
      );

      const hubGrubLogClients: DbHubGrubLogClient[] = clients.map((client) =>
        addDbMiddleware(
          {
            pK: client.id,
            sK: id,
            entityType: "hubGrubLogClient",
            ...client,
          },
          user
        )
      );

      const hubGrubLogMps: DbHubGrubLogMp[] = mps.map((mp) =>
        addDbMiddleware(
          {
            pK: mp.id,
            sK: id,
            entityType: "hubGrubLogMp",
            ...mp,
          },
          user
        )
      );

      const hubGrubLogVolunteers: DbHubGrubLogVolunteer[] = volunteers.map(
        (volunteer) =>
          addDbMiddleware(
            {
              pK: volunteer.id,
              sK: id,
              entityType: "hubGrubLogVolunteer",
              ...volunteer,
            },
            user
          )
      );

      await this.hubGrubLogRepository.update(
        [hubGrubLogMain, ...hubGrubLogClients, ...hubGrubLogMps, ...hubGrubLogVolunteers],
        user
      );
    } catch (error) {
      console.error("Service Layer Error updating hub & grub logs:", error);
      throw error;
    }
  }

  async delete(user: User, hubGrubLogId: string): Promise<number> {
    try {
      const numDeleted = await this.hubGrubLogRepository.delete(hubGrubLogId, user);
      return numDeleted[0];
    } catch (error) {
      console.error("Service Layer Error deleting hub & grub log:", error);
      throw error;
    }
  }

  private transformDbHubGrubLogToShared(items: DbHubGrubLog[]): HubGrubLog[] {
    const hubGrubLogsMap = new Map<string, Partial<HubGrubLog>>();

    for (const item of items) {
      const hubGrubLogId = item.sK;

      if (!hubGrubLogsMap.has(hubGrubLogId)) {
        hubGrubLogsMap.set(hubGrubLogId, {
          id: hubGrubLogId,
        });
      }

      const hubGrubLog = hubGrubLogsMap.get(hubGrubLogId)!;

      if (item.pK.startsWith("hubGrub")) {
        if (!hubGrubLog.clients) hubGrubLog.clients = [];
        if (!hubGrubLog.mps) hubGrubLog.mps = [];
        if (!hubGrubLog.volunteers) hubGrubLog.volunteers = [];
        const { pK, sK, entityType, ...rest } = item as DbHubGrubLogEntity;
        Object.assign(hubGrubLog, rest);
        continue;
      } else if (item.pK.startsWith("c")) {
        if (!hubGrubLog.clients) hubGrubLog.clients = [];
        const { pK, sK, entityType, ...rest } = item as DbHubGrubLogClient;
        hubGrubLog.clients.push({
          id: item.pK,
          ...rest,
        });
        continue;
      } else if (item.pK.startsWith("m")) {
        if (!hubGrubLog.mps) hubGrubLog.mps = [];
        const { pK, sK, entityType, ...rest } = item as DbHubGrubLogMp;
        hubGrubLog.mps.push({
          id: item.pK,
          ...rest,
        });
      } else if (item.pK.startsWith("v")) {
        if (!hubGrubLog.volunteers) hubGrubLog.volunteers = [];
        const { pK, sK, entityType, ...rest } = item as DbHubGrubLogVolunteer;
        hubGrubLog.volunteers.push({
          id: item.pK,
          ...rest,
        });
      } else throw new Error(`Undefined Case: ${item}`);
    }

    return Array.from(hubGrubLogsMap.values()) as HubGrubLog[];
  }
}
