import { VolunteerLog, volunteerLogSchema } from "shared";
import { VolunteerLogRepository } from "./repository";
import {
  DbVolunteerLog,
  DbVolunteerLogClient,
  DbVolunteerLogEntity,
  DbVolunteerLogVolunteer,
} from "./schema";

export class VolunteerLogService {
  volunteerLogRepository = new VolunteerLogRepository();
  async getAll(): Promise<VolunteerLog[]> {
    const volunteerLogs = await this.volunteerLogRepository.getAll();
    const transformedResult = this.groupAndTransformVolunteerLogData(
      volunteerLogs
    ) as VolunteerLog[];
    const parsedResult = volunteerLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(volunteerLogId: string): Promise<VolunteerLog> {
    const volunteer = await this.volunteerLogRepository.getById(volunteerLogId);
    const transformedResult = this.groupAndTransformVolunteerLogData(
      volunteer
    ) as VolunteerLog[];
    const parsedResult = volunteerLogSchema.array().parse(transformedResult);
    return parsedResult[0];
  }

  async getBySubstring(string: string): Promise<VolunteerLog[]> {
    const metaLogs = await this.volunteerLogRepository.getMetaLogsBySubstring(
      string
    );
    const idsToFetch = metaLogs.map((log) => log.sK);
    const parsedResult: VolunteerLog[] = [];
    for (const id of idsToFetch) {
      const fetchedLog = await this.volunteerLogRepository.getById(id);
      const parsedLog = this.groupAndTransformVolunteerLogData(fetchedLog);
      parsedResult.push(parsedLog[0]);
    }
    return parsedResult;
  }

  async getByVolunteerId(volunteerId: string): Promise<VolunteerLog[]> {
    const metaLogs = await this.volunteerLogRepository.getMetaLogsByVolunteerId(
      volunteerId
    );
    const idsToFetch = metaLogs.map((log) => log.sK);
    const parsedResult: VolunteerLog[] = [];
    for (const id of idsToFetch) {
      const fetchedLog = await this.volunteerLogRepository.getById(id);
      const parsedLog = this.groupAndTransformVolunteerLogData(fetchedLog);
      parsedResult.push(parsedLog[0]);
    }
    return parsedResult;
  }

  async getByDateInterval(input: {
    startDate: string;
    endDate: string;
  }): Promise<VolunteerLog[]> {
    const mag = await this.volunteerLogRepository.getByDateInterval(input);
    const transformedResult = this.groupAndTransformVolunteerLogData(
      mag
    ) as VolunteerLog[];
    const parsedResult = volunteerLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async create(
    newVolunteerLog: Omit<VolunteerLog, "id">,
    userId: string
  ): Promise<VolunteerLog> {
    const validatedInput = volunteerLogSchema
      .omit({ id: true })
      .parse(newVolunteerLog);

    const volunteerLogMain: Omit<DbVolunteerLogEntity, "pK" | "sK"> = {
      ...validatedInput,
      entityType: "volunteerLog",
      entityOwner: "main",
    };
    const volunteerLogVolunteers: Omit<DbVolunteerLogVolunteer, "sK">[] =
      validatedInput.volunteers.map((volunteer) => ({
        date: validatedInput.date,
        entityType: "volunteerLog",
        entityOwner: "volunteer",
        pK: volunteer.id,
        ...volunteer,
      }));
    const volunteerLogClients: Omit<DbVolunteerLogClient, "sK">[] =
      validatedInput.clients.map((client) => ({
        date: validatedInput.date,
        entityType: "volunteerLog",
        entityOwner: "client",
        pK: client.id,
        ...client,
      }));
    try {
      const createdLogId = await this.volunteerLogRepository.create(
        [volunteerLogMain, ...volunteerLogVolunteers, ...volunteerLogClients],
        userId
      );

      const fetchedLog = await this.getById(createdLogId);
      if (!fetchedLog) {
        throw new Error("Failed to fetch created volunteer log");
      }

      const { id, ...restFetched } = fetchedLog;

      if (JSON.stringify(validatedInput) !== JSON.stringify(restFetched)) {
        throw new Error("Created volunteer log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error creating volunteerLogs:", error);
      throw error;
    }
  }

  async update(
    updatedVolunteerLog: VolunteerLog,
    userId: string
  ): Promise<VolunteerLog> {
    const validatedInput = volunteerLogSchema.parse(updatedVolunteerLog);
    const volunteerLogKey = validatedInput.id;

    const volunteerLogMain: DbVolunteerLogEntity = {
      ...validatedInput,
      pK: volunteerLogKey,
      sK: volunteerLogKey,
      entityType: "volunteerLog",
      entityOwner: "main",
    };
    const volunteerLogVolunteers: DbVolunteerLogVolunteer[] =
      validatedInput.volunteers.map((volunteer) => ({
        pK: volunteer.id,
        sK: volunteerLogKey,
        date: validatedInput.date,
        entityType: "volunteerLog",
        entityOwner: "volunteer",
        ...volunteer,
      }));
    const volunteerLogClients: DbVolunteerLogClient[] =
      validatedInput.clients.map((client) => ({
        pK: client.id,
        sK: volunteerLogKey,
        date: validatedInput.date,
        entityType: "volunteerLog",
        entityOwner: "client",
        ...client,
      }));
    try {
      await this.volunteerLogRepository.update(
        [volunteerLogMain, ...volunteerLogVolunteers, ...volunteerLogClients],
        userId
      );

      const fetchedLog = await this.getById(updatedVolunteerLog.id);
      if (!fetchedLog) {
        throw new Error("Failed to fetch updated volunteer log");
      }

      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedLog)) {
        throw new Error("Updated volunteer log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error updating volunteerLogs:", error);
      throw error;
    }
  }

  async delete(volunteerLogId: string): Promise<number> {
    const numDeleted = await this.volunteerLogRepository.delete(volunteerLogId);
    return numDeleted[0];
  }

  private groupAndTransformVolunteerLogData(
    items: DbVolunteerLog[]
  ): VolunteerLog[] {
    const volunteerLogsMap = new Map<string, Partial<VolunteerLog>>();

    for (const item of items) {
      const volunteerLogId = item.sK;

      if (!volunteerLogsMap.has(volunteerLogId)) {
        volunteerLogsMap.set(volunteerLogId, {
          id: volunteerLogId,
        });
      }

      const volunteerLog = volunteerLogsMap.get(volunteerLogId)!;

      switch (item.entityOwner) {
        case "main":
          volunteerLog.date = item.date;
          volunteerLog.details = item.details;
          break;
        case "volunteer":
          if (!volunteerLog.volunteers) volunteerLog.volunteers = [];
          volunteerLog.volunteers.push({
            id: item.pK,
            details: item.details,
          });
          break;
        case "client":
          if (!volunteerLog.clients) volunteerLog.clients = [];
          volunteerLog.clients.push({
            id: item.pK,
            postCode: item.postCode,
            details: item.details,
          });
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }
    return Array.from(volunteerLogsMap.values()) as VolunteerLog[];
  }
}
