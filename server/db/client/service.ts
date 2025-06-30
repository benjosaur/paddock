import {
  ClientFull,
  clientFullSchema,
  ClientMetadata,
  clientMetadataSchema,
} from "shared";
import { ClientRepository } from "./repository";
import { DbClientEntity, DbClientFull, DbClientMetadata } from "./schema";
import { MpLogService } from "../mplog/service";
import { VolunteerLogService } from "../vlog/service";
import { MagLogService } from "../mag/service";

export class ClientService {
  clientRepository = new ClientRepository();
  mpLogService = new MpLogService();
  volunteerLogService = new VolunteerLogService();
  magLogService = new MagLogService();

  async getAll(): Promise<ClientMetadata[]> {
    try {
      const clients = await this.clientRepository.getAll();
      const transformedResult = this.transformDbClientToSharedMetaData(
        clients
      ) as ClientMetadata[];
      const parsedResult = clientMetadataSchema
        .array()
        .parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all clients:", error);
      throw error;
    }
  }

  async getById(clientId: string): Promise<ClientFull> {
    try {
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

      const clientMetadata = this.transformDbClientToSharedMetaData(
        client
      ) as Partial<ClientFull>[];

      const mpLogs = await Promise.all(
        mpLogIds.map(
          async (mpLogId) => await this.mpLogService.getById(mpLogId)
        )
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
    } catch (error) {
      console.error("Service Layer Error getting client by ID:", error);
      throw error;
    }
  }

  async create(newClient: Omit<ClientMetadata, "id">): Promise<ClientFull> {
    try {
      const clientToCreate: Omit<DbClientEntity, "id" | "pK" | "sK"> = {
        ...newClient,
        entityType: "client",
        entityOwner: "client",
      };
      const createdClient = await this.clientRepository.create(clientToCreate);
      const transformedClient =
        this.transformDbClientToSharedMetaData(createdClient);
      const parsedResult = clientFullSchema.array().parse(transformedClient);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error creating client:", error);
      throw error;
    }
  }

  async update(updatedClient: ClientMetadata): Promise<ClientFull> {
    try {
      const dbClient: DbClientEntity = {
        pK: updatedClient.id,
        sK: updatedClient.id,
        entityType: "client",
        entityOwner: "client",
        dateOfBirth: updatedClient.dateOfBirth,
        postCode: updatedClient.postCode,
        details: updatedClient.details,
      };

      await this.clientRepository.update(dbClient);
      const updatedClientData = await this.getById(updatedClient.id);
      // TODO: Update associated logs (duplicated details::name)
      return updatedClientData;
    } catch (error) {
      console.error("Service Layer Error updating client:", error);
      throw error;
    }
  }

  async delete(clientId: string): Promise<number[]> {
    try {
      const deletedCount = await this.clientRepository.delete(clientId);
      return deletedCount;
    } catch (error) {
      console.error("Service Layer Error deleting client:", error);
      throw error;
    }
  }

  private transformDbClientToSharedMetaData(
    items: DbClientMetadata[] | DbClientFull[]
  ): ClientMetadata[] {
    // for creating full clients handle fetching + adding full logs separately after transform
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
