import { MagLog, magLogSchema } from "shared";
import { MagLogRepository } from "./repository";
import {
  DbMagLog,
  DbMagLogClient,
  DbMagLogEntity,
  DbMagLogMp,
  DbMagLogVolunteer,
} from "./schema";
import { id } from "zod/v4/locales";
import { client } from "../repository";

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

  async getById(magLogId: string, user: User): Promise<MagLog> {
    const mag = await this.magLogRepository.getById(magLogId, user);
    console.log(mag);
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
    const mag = await this.magLogRepository.getByDateInterval(input, user);
    const transformedResult = this.transformDbMagLogToShared(mag) as MagLog[];
    const parsedResult = magLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async create(newMagLog: Omit<MagLog, "id">, user: User): Promise<string> {
    const validatedInput = magLogSchema.omit({ id: true }).parse(newMagLog);

    const magLogMain: Omit<DbMagLogEntity, "pK" | "sK"> = {
      ...validatedInput,
      entityType: "magLogEntity",
    };
    const magLogClients: Omit<DbMagLogClient, "sK">[] =
      validatedInput.clients.map((client) => ({
        date: validatedInput.date,
        entityType: "magLogClient",
        entityOwner: "client",
        pK: client.id,
        ...client,
      }));
    const magLogMps: Omit<DbMagLogMp, "sK">[] = validatedInput.mps.map(
      (mp) => ({
        date: validatedInput.date,
        entityType: "magLogMp",
        entityOwner: "mp",
        pK: mp.id,
        ...mp,
      })
    );
    const magLogVolunteers: Omit<DbMagLogVolunteer, "sK">[] =
      validatedInput.volunteers.map((volunteer) => ({
        date: validatedInput.date,
        entityType: "magLogVolunteer",
        entityOwner: "volunteer",
        pK: volunteer.id,
        ...volunteer,
      }));
    try {
      const createdLogId = await this.magLogRepository.createMagEntity(
        [magLogMain],
        user
      );
      await this.magLogRepository.createMagReference(
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
    const validatedInput = magLogSchema.parse(updatedMpLog);
    const { id, clients, mps, volunteers, ...rest } = validatedInput;

    // delete all refs in case mps or volunteers purposely removed
    this.magLogRepository.delete(id, user);

    const magLogMain: DbMagLogEntity = {
      ...rest,
      pK: id,
      sK: id,
      entityType: "magLogEntity",
    };

    const magLogClients: DbMagLogClient[] = clients.map(
      (client): DbMagLogClient => ({
        pK: client.id,
        sK: id,
        entityType: "magLogClient",
        ...client,
      })
    );

    const magLogMps: DbMagLogMp[] = mps.map(
      (mp): DbMagLogMp => ({
        pK: mp.id,
        sK: id,
        entityType: "magLogMp",
        ...mp,
      })
    );

    const magLogVolunteers: DbMagLogVolunteer[] = volunteers.map(
      (volunteer): DbMagLogVolunteer => ({
        pK: volunteer.id,
        sK: id,
        entityType: "magLogVolunteer",
        ...volunteer,
      })
    );

    try {
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
    const numDeleted = await this.magLogRepository.delete(magLogId, user);
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
