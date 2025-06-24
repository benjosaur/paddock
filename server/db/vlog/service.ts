import { VolunteerLog, volunteerLogSchema } from "shared";
import { VolunteerLogRepository } from "./repository";
import { DbVolunteerLog } from "./schema";

export class VolunteerLogService {
  volunteerLogRepository = new VolunteerLogRepository();
  async getAll(): Promise<VolunteerLog[]> {
    const volunteerLogs = await this.volunteerLogRepository.getAll();
    console.log(volunteerLogs);
    const transformedResult = this.groupAndTransformVolunteerLogData(
      volunteerLogs
    ) as VolunteerLog[];
    const parsedResult = volunteerLogSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(volunteerLogId: string): Promise<VolunteerLog[]> {
    const volunteer = await this.volunteerLogRepository.getById(volunteerLogId);
    const transformedResult = this.groupAndTransformVolunteerLogData(
      volunteer
    ) as VolunteerLog[];
    const parsedResult = volunteerLogSchema.array().parse(transformedResult);
    return parsedResult;
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
