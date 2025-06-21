import {
  ClientFull,
  clientFullSchema,
  ClientMetadata,
  clientMetadataSchema,
} from "shared";
import { ClientRepository } from "./repository";
import { DbClientFull, DbClientMetadata } from "./schema";

export class ClientService {
  clientRepository = new ClientRepository();
  async getAll(): Promise<ClientMetadata[]> {
    const clients = await this.clientRepository.getAll();
    const transformedResult = this.groupAndTransformClientData(
      clients
    ) as ClientMetadata[];
    const parsedResult = clientMetadataSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(clientId: string): Promise<ClientFull[]> {
    const client = await this.clientRepository.getById(clientId);
    const transformedResult = this.groupAndTransformClientData(
      client
    ) as ClientFull[];
    const parsedResult = clientFullSchema.array().parse(transformedResult);
    return parsedResult;
  }

  private groupAndTransformClientData(
    items: DbClientMetadata[] | DbClientFull[]
  ): ClientMetadata[] | ClientFull[] {
    const clientsMap = new Map<string, Partial<ClientFull>>();

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
          if (!client.mpLogs) client.mpLogs = [];
          client.mpLogs.push({
            id: item.sK,
            date: item.date,
            details: {
              notes: item.details.notes,
            },
          });
          break;
        case "volunteerLog":
          if (!client.volunteerLogs) client.volunteerLogs = [];
          client.volunteerLogs.push({
            id: item.sK,
            date: item.date,
            details: {
              notes: item.details.notes,
            },
          });
          break;
        case "magLog":
          if (!client.magLogs) client.magLogs = [];
          client.magLogs.push({
            id: item.sK,
            date: item.date,
            details: {
              notes: item.details.notes,
            },
          });
          break;
        default:
          throw new Error(`Undefined Case: ${item}`);
      }
    }

    return Array.from(clientsMap.values()) as ClientMetadata[] | ClientFull[];
  }
}
