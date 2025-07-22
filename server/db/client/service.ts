import {
  ClientFull,
  clientFullSchema,
  ClientMetadata,
  clientMetadataSchema,
} from "shared";
import { ClientRepository } from "./repository";
import { DbClientEntity } from "./schema";
import { PackageService } from "../package/service";
import { MagLogService } from "../mag/service";
import { RequestService } from "../requests/service";
import { DbRequestEntity } from "../requests/schema";
import { DbMagLogClient } from "../mag/schema";
import { PackageRepository } from "../package/repository";
import { MagLogRepository } from "../mag/repository";
import { RequestRepository } from "../requests/repository";
import { genericUpdate } from "../repository";

export class ClientService {
  clientRepository = new ClientRepository();
  magLogService = new MagLogService();
  requestService = new RequestService();
  packageService = new PackageService();
  packageRepository = new PackageRepository();
  magLogRepository = new MagLogRepository();
  requestRepository = new RequestRepository();

  async getAllNotArchived(user: User): Promise<ClientMetadata[]> {
    try {
      const dbClients = await this.clientRepository.getAllNotArchived(user);
      const dbRequests = await this.requestRepository.getAllNotArchived(user);
      const transformedResult = this.transformDbClientToSharedMetaData([
        ...dbClients,
        ...dbRequests,
      ]);
      const parsedResult = clientMetadataSchema
        .array()
        .parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all clients:", error);
      throw error;
    }
  }

  async getAll(user: User): Promise<ClientMetadata[]> {
    try {
      const dbClients = await this.clientRepository.getAll(user);
      const dbRequests = await this.requestRepository.getAll(null, user);
      const transformedResult = this.transformDbClientToSharedMetaData([
        ...dbClients,
        ...dbRequests,
      ]);
      const parsedResult = clientMetadataSchema
        .array()
        .parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all clients:", error);
      throw error;
    }
  }

  async getById(clientId: string, user: User): Promise<ClientFull> {
    try {
      const client = await this.clientRepository.getById(clientId, user);
      const requestIds = client
        .filter((dbResult) => dbResult.sK.startsWith("req"))
        .map((req) => req.sK);
      const magLogIds = client
        .filter((dbResult) => dbResult.sK.startsWith("mag"))
        .map((magLog) => magLog.sK);

      const clientMetadata = this.transformDbClientToSharedMetaData(
        client
      ) as Partial<ClientFull>[];
      const requests = await Promise.all(
        requestIds.map(
          async (requestId) =>
            await this.requestService.getById(requestId, user)
        )
      );
      const magLogs = await Promise.all(
        magLogIds.map(
          async (magLogId) => await this.magLogService.getById(magLogId, user)
        )
      );
      const fullClient = [{ ...clientMetadata[0], requests, magLogs }];
      const parsedResult = clientFullSchema.array().parse(fullClient);

      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error getting client by ID:", error);
      throw error;
    }
  }

  async create(newClient: Omit<ClientFull, "id">, user: User): Promise<string> {
    try {
      const validatedInput = clientFullSchema
        .omit({ id: true })
        .parse(newClient);

      const clientToCreate: Omit<DbClientEntity, "pK" | "sK"> = {
        ...validatedInput,
        entityType: "client",
      };
      const createdClientId = await this.clientRepository.create(
        clientToCreate,
        user
      );
      return createdClientId;
    } catch (error) {
      console.error("Service Layer Error creating client:", error);
      throw error;
    }
  }

  async update(updatedClient: ClientFull, user: User): Promise<void> {
    //note for name or postcode (only metachanges)
    try {
      const validatedInput = clientMetadataSchema.parse(updatedClient);
      const { id, ...rest } = validatedInput;
      const dbClient: DbClientEntity = {
        pK: id,
        sK: id,
        entityType: "client",
        ...rest,
      };
      await this.clientRepository.update(dbClient, user);
    } catch (error) {
      console.error("Service Layer Error updating client:", error);
      throw error;
    }
  }

  async updateName(
    clientId: string,
    newName: string,
    user: User
  ): Promise<void> {
    // update mags and reqs
    try {
      const initialClientRecords = await this.clientRepository.getById(
        clientId,
        user
      );
      const updatedClientRecords = initialClientRecords.map((record) => ({
        ...record,
        details: { ...record.details, name: newName },
      }));
      await genericUpdate(updatedClientRecords, user);
    } catch (error) {
      console.error("Service Layer Error updating Client Name:", error);
      throw error;
    }
  }

  async updatePostCode(
    clientId: string,
    newPostCode: string,
    user: User
  ): Promise<void> {
    // update clientEntity & magLogClient
    try {
      const initialClientRecords = await this.clientRepository.getById(
        clientId,
        user
      );
      const initialEntityAndMagLogClients = initialClientRecords.filter(
        (record) => record.sK === "magLogClient" || record.sK === "client"
      );
      const updatedEntityAndMagLogClients = initialEntityAndMagLogClients.map(
        (record) => ({ ...record, postCode: newPostCode })
      );
      await genericUpdate(updatedEntityAndMagLogClients, user);
    } catch (error) {
      console.error("Service Layer Error updating Client Name:", error);
      throw error;
    }
  }

  async delete(user: User, clientId: string): Promise<number[]> {
    try {
      const deletedCount = await this.clientRepository.delete(clientId, user);
      return deletedCount;
    } catch (error) {
      console.error("Service Layer Error deleting client:", error);
      throw error;
    }
  }

  private transformDbClientToSharedMetaData(
    items: (DbClientEntity | DbRequestEntity | DbMagLogClient)[]
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

      if (item.sK.startsWith("c")) {
        const { pK, sK, entityType, ...rest } = item as DbClientEntity;
        const fetchedClient: Omit<ClientMetadata, "requests"> = {
          id: pK,
          ...rest,
        };
        Object.assign(client, fetchedClient);
        continue;
      } else if (item.sK.startsWith("req")) {
        if (!client.requests) client.requests = [];
        const { pK, sK, entityType, ...rest } = item as DbRequestEntity;
        client.requests.push({
          id: sK,
          clientId: pK,
          ...rest,
        });
        continue;
      } else if (item.sK.startsWith("mag")) {
        continue;
      } else throw new Error(`Undefined Case: ${item}`);
    }

    return Array.from(clientsMap.values()) as ClientMetadata[];
  }
}
