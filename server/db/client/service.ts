import {
  ClientFull,
  clientFullSchema,
  ClientMetadata,
  clientMetadataSchema,
} from "shared";
import { ClientRepository } from "./repository";
import { DbClientFull, DbClientMetadata } from "./schema";
import { MpLogService } from "../mplog/service";
import { VolunteerLogService } from "../vlog/service";
import { MagLogService } from "../mag/service";

export class ClientService {
  clientRepository = new ClientRepository();
  mpLogService = new MpLogService();
  volunteerLogService = new VolunteerLogService();
  magLogService = new MagLogService();

  async getAll(): Promise<ClientMetadata[]> {
    const clients = await this.clientRepository.getAll();
    const transformedResult = this.transformDbClientToMetaData(
      clients
    ) as ClientMetadata[];
    const parsedResult = clientMetadataSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(clientId: string): Promise<ClientFull> {
    const client = await this.clientRepository.getById(clientId);

    const mpLogIds = client
      .filter((dbResult) => dbResult.entityType == "mpLog")
      .map((mpLog) => mpLog.sK);
    const vLogIds = client
      .filter((dbResult) => dbResult.entityType == "volunteerLog")
      .map((volunteerLog) => volunteerLog.sK);
    const magLogIds = client
      .filter((dbResult) => dbResult.entityType == "magLog")
      .map((magLog) => magLog.sK);

    const clientMetadata = this.transformDbClientToMetaData(
      client
    ) as Partial<ClientFull>[];

    const mpLogs = await Promise.all(
      mpLogIds.map(async (mpLogId) => await this.mpLogService.getById(mpLogId))
    );
    const volunteerLogs = await Promise.all(
      vLogIds.map(
        async (vLogId) => await this.volunteerLogService.getById(vLogId)
      )
    );
    const magLogs = await Promise.all(
      magLogIds.map(
        async (magLogId) => await this.magLogService.getById(magLogId)
      )
    );

    const fullClient = [
      { ...clientMetadata[0], mpLogs, volunteerLogs, magLogs },
    ];
    const parsedResult = clientFullSchema.array().parse(fullClient);

    return parsedResult[0];
  }

  private transformDbClientToMetaData(
    items: DbClientMetadata[] | DbClientFull[]
  ): ClientMetadata[] {
    const clientsMap = new Map<string, Partial<ClientMetadata>>();

    for (const item of items) {
      const clientId = item.pK;

      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          id: clientId,
        });
      }

      const client = clientsMap.get(clientId)!;

      switch (item.entityType) {
        case "client":
          client.dateOfBirth = item.dateOfBirth;
          client.postCode = item.postCode;
          client.details = item.details;
          break;
        case "clientMpRequest":
          if (!client.mpRequests) client.mpRequests = [];
          client.mpRequests.push({
            id: item.sK,
            date: item.date,
            details: {
              notes: item.details.notes,
            },
          });
          break;
        case "clientVolunteerRequest":
          if (!client.volunteerRequests) client.volunteerRequests = [];
          client.volunteerRequests.push({
            id: item.sK,
            date: item.date,
            details: {
              notes: item.details.notes,
            },
          });
          break;
        case "mpLog":
          break;
        case "volunteerLog":
          break;
        case "magLog":
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }

    return Array.from(clientsMap.values()) as ClientMetadata[];
  }
}
