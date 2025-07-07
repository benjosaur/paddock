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
import { RequestService } from "../requests/service";

export class ClientService {
  clientRepository = new ClientRepository();
  mpLogService = new MpLogService();
  volunteerLogService = new VolunteerLogService();
  magLogService = new MagLogService();
  requestService = new RequestService();

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

  async create(
    newClient: Omit<ClientFull, "id">,
    userId: string
  ): Promise<ClientFull> {
    try {
      const validatedInput = clientFullSchema
        .omit({ id: true })
        .parse(newClient);

      const clientToCreate: Omit<DbClientEntity, "id" | "pK" | "sK"> = {
        ...validatedInput,
        entityType: "client",
        entityOwner: "client",
      };
      const createdClientId = await this.clientRepository.create(
        clientToCreate,
        userId
      );

      const fetchedClient = await this.getById(createdClientId);
      if (!fetchedClient) {
        throw new Error("Failed to fetch created client");
      }

      const { id, ...restFetched } = fetchedClient;

      if (JSON.stringify(validatedInput) !== JSON.stringify(restFetched)) {
        console.log(validatedInput);
        console.log(restFetched);
        throw new Error("Created client does not match expected values");
      }

      return fetchedClient;
    } catch (error) {
      console.error("Service Layer Error creating client:", error);
      throw error;
    }
  }

  async update(updatedClient: ClientFull, userId: string): Promise<ClientFull> {
    //note for name or postcode (only metachanges)
    try {
      const validatedInput = clientFullSchema.parse(updatedClient);

      const dbClient: DbClientEntity = {
        pK: validatedInput.id,
        sK: validatedInput.id,
        entityType: "client",
        entityOwner: "client",
        dateOfBirth: validatedInput.dateOfBirth,
        postCode: validatedInput.postCode,
        details: validatedInput.details,
      };

      await this.clientRepository.update(dbClient, userId);
      const fetchedClient = await this.getById(validatedInput.id);

      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedClient)) {
        throw new Error("Updated client does not match expected values");
      }

      return fetchedClient;
    } catch (error) {
      console.error("Service Layer Error updating client:", error);
      throw error;
    }
  }

  async updateName(
    updatedClient: ClientFull,
    userId: string
  ): Promise<ClientFull> {
    try {
      const validatedInput = clientFullSchema.parse(updatedClient);

      const clientEntityUpdate = this.update(validatedInput, userId);
      const mpLogUpdates = validatedInput.mpLogs.map((log) =>
        this.mpLogService.update(log, userId)
      );
      const volunteerLogUpdates = validatedInput.volunteerLogs.map((log) =>
        this.volunteerLogService.update(log, userId)
      );
      await Promise.all([
        clientEntityUpdate,
        ...mpLogUpdates,
        ...volunteerLogUpdates,
      ]);
      const fetchedClient = await this.getById(validatedInput.id);

      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedClient)) {
        throw new Error("Updated client name does not match expected values");
      }
      return fetchedClient;
    } catch (error) {
      console.error("Service Layer Error updating Client Name:", error);
      throw error;
    }
  }

  async updatePostCode(
    updatedClient: ClientFull,
    userId: string
  ): Promise<ClientFull> {
    try {
      const validatedInput = clientFullSchema.parse(updatedClient);

      const clientEntityUpdate = this.update(validatedInput, userId);
      const mpLogUpdates = validatedInput.mpLogs.map((log) =>
        this.mpLogService.update(log, userId)
      );
      const volunteerLogUpdates = validatedInput.volunteerLogs.map((log) =>
        this.volunteerLogService.update(log, userId)
      );
      const mpRequestUpdates = validatedInput.mpRequests.map((request) =>
        this.requestService.update(request, userId)
      );
      const volunteerRequestUpdates = validatedInput.volunteerRequests.map(
        (request) => this.requestService.update(request, userId)
      );
      await Promise.all([
        clientEntityUpdate,
        ...mpLogUpdates,
        ...volunteerLogUpdates,
        ...mpRequestUpdates,
        ...volunteerRequestUpdates,
      ]);
      const fetchedClient = await this.getById(validatedInput.id);

      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedClient)) {
        throw new Error(
          "Updated client postcode does not match expected values"
        );
      }
      return fetchedClient;
    } catch (error) {
      console.error("Service Layer Error updating MP Name:", error);
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
            clientId: item.pK,
            requestType: "mp",
            startDate: item.date,
            details: item.details,
          });
          break;
        case "clientVolunteerRequest":
          if (!client.volunteerRequests) client.volunteerRequests = [];
          client.volunteerRequests.push({
            id: item.sK,
            clientId: item.pK,
            requestType: "volunteer",
            startDate: item.date,
            details: item.details,
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
