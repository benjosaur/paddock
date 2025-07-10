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
import { sleep } from "bun";
import {
  DbClientMpRequestEntity,
  DbClientVolunteerRequestEntity,
} from "../requests/schema";
import { DbMpLogClient } from "../mplog/schema";
import { DbVolunteerLogClient } from "../vlog/schema";
import { DbMagLogClient } from "../mag/schema";
import { MpLogRepository } from "../mplog/repository";
import { VolunteerLogRepository } from "../vlog/repository";
import { MagLogRepository } from "../mag/repository";
import { RequestRepository } from "../requests/repository";

export class ClientService {
  clientRepository = new ClientRepository();
  mpLogService = new MpLogService();
  volunteerLogService = new VolunteerLogService();
  magLogService = new MagLogService();
  requestService = new RequestService();
  mpLogRepository = new MpLogRepository();
  volunteerLogRepository = new VolunteerLogRepository();
  magLogRepository = new MagLogRepository();
  requestRepository = new RequestRepository();

  async getAll(user: User): Promise<ClientMetadata[]> {
    try {
      const clients = await this.clientRepository.getAll(user);
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

  async getById(user: User, clientId: string): Promise<ClientFull> {
    try {
      const client = await this.clientRepository.getById(user, clientId);
      console.log(client);
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
          async (mpLogId) => await this.mpLogService.getById(user, mpLogId)
        )
      );
      const volunteerLogs = await Promise.all(
        vLogIds.map(
          async (vLogId) => await this.volunteerLogService.getById(user, vLogId)
        )
      );
      const magLogs = await Promise.all(
        magLogIds.map(
          async (magLogId) => await this.magLogService.getById(user, magLogId)
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
    user: User
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
        user
      );

      const fetchedClient = await this.getById(user, createdClientId);
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

  async update(updatedClient: ClientFull, user: User): Promise<ClientFull> {
    //note for name or postcode (only metachanges)
    try {
      const validatedInput = clientMetadataSchema.parse(updatedClient);

      const dbClient: DbClientEntity = {
        pK: validatedInput.id,
        sK: validatedInput.id,
        entityType: "client",
        entityOwner: "client",
        dateOfBirth: validatedInput.dateOfBirth,
        postCode: validatedInput.postCode,
        details: validatedInput.details,
      };
      await this.clientRepository.update(dbClient, user);
      const fetchedClient = await this.getById(user, validatedInput.id);
      if (
        JSON.stringify(validatedInput) !==
        JSON.stringify(clientMetadataSchema.parse(fetchedClient))
      ) {
        console.log(validatedInput, fetchedClient);
        throw new Error("Updated client does not match expected values");
      }
      return fetchedClient;
    } catch (error) {
      console.error("Service Layer Error updating client:", error);
      throw error;
    }
  }

  async updateName(
    clientId: string,
    newName: string,
    user: User
  ): Promise<ClientFull> {
    try {
      const initialClient = await this.getById(user, clientId);

      const updatedClient = {
        ...initialClient,
        details: { ...initialClient.details, name: newName },
      };
      const updatedClientMpRequests: DbClientMpRequestEntity[] =
        initialClient.mpRequests.map((req) => ({
          pK: clientId,
          sK: req.id,
          date: req.startDate,
          details: req.details,
          entityOwner: "client",
          entityType: "clientMpRequest",
        }));
      const updatedClientVolunteerRequests: DbClientVolunteerRequestEntity[] =
        initialClient.volunteerRequests.map((req) => ({
          pK: clientId,
          sK: req.id,
          date: req.startDate,
          details: req.details,
          entityOwner: "client",
          entityType: "clientVolunteerRequest",
        }));
      const updatedClientMpLogs: DbMpLogClient[] = initialClient.mpLogs.map(
        (log) => ({
          pK: clientId,
          sK: log.id,
          postCode: initialClient.postCode,
          date: log.date,
          details: { ...log.details, name: newName },
          entityOwner: "client",
          entityType: "mpLog",
        })
      );
      const updatedClientVolunteerLogs: DbVolunteerLogClient[] =
        initialClient.volunteerLogs.map((log) => ({
          pK: clientId,
          sK: log.id,
          postCode: initialClient.postCode,
          date: log.date,
          details: { ...log.details, name: newName },
          entityOwner: "client",
          entityType: "volunteerLog",
        }));
      const updatedClientMagLogs: DbMagLogClient[] = initialClient.magLogs.map(
        (log) => ({
          pK: clientId,
          sK: log.id,
          postCode: initialClient.postCode,
          date: log.date,
          details: { ...log.details, name: newName },
          entityOwner: "client",
          entityType: "magLog",
        })
      );
      console.log(updatedClientMagLogs);
      await Promise.all([
        this.update(updatedClient, user),
        ...updatedClientMpRequests.map((req) =>
          this.requestRepository.update(req, user)
        ),
        ...updatedClientVolunteerRequests.map((req) =>
          this.requestRepository.update(req, user)
        ),
        ...updatedClientMpLogs.map((log) =>
          this.mpLogRepository.update([log], user)
        ),
        ...updatedClientVolunteerLogs.map((log) =>
          this.volunteerLogRepository.update([log], user)
        ),
        ...updatedClientMagLogs.map((log) =>
          this.magLogRepository.update([log], user)
        ),
      ]);

      const fetchedClient = this.getById(user, clientId);

      return fetchedClient;
    } catch (error) {
      console.error("Service Layer Error updating Client Name:", error);
      throw error;
    }
  }

  async updatePostCode(
    clientId: string,
    newPostCode: string,
    user: User
  ): Promise<ClientFull> {
    try {
      const initialClient = await this.getById(user, clientId);

      const updatedClient = {
        ...initialClient,
        postCode: newPostCode,
      };
      const updatedClientMpLogs: DbMpLogClient[] = initialClient.mpLogs.map(
        (log) => ({
          pK: clientId,
          sK: log.id,
          postCode: newPostCode,
          date: log.date,
          details: { ...log.details, name: initialClient.details.name },
          entityOwner: "client",
          entityType: "mpLog",
        })
      );
      const updatedClientVolunteerLogs: DbVolunteerLogClient[] =
        initialClient.volunteerLogs.map((log) => ({
          pK: clientId,
          sK: log.id,
          postCode: newPostCode,
          date: log.date,
          details: { ...log.details, name: initialClient.details.name },
          entityOwner: "client",
          entityType: "volunteerLog",
        }));
      const updatedClientMagLogs: DbMagLogClient[] = initialClient.magLogs.map(
        (log) => ({
          pK: clientId,
          sK: log.id,
          postCode: newPostCode,
          date: log.date,
          details: { ...log.details, name: initialClient.details.name },
          entityOwner: "client",
          entityType: "magLog",
        })
      );
      await Promise.all([
        this.update(updatedClient, user),
        ...updatedClientMpLogs.map((log) =>
          this.mpLogRepository.update([log], user)
        ),
        ...updatedClientVolunteerLogs.map((log) =>
          this.volunteerLogRepository.update([log], user)
        ),
        ...updatedClientMagLogs.map((log) =>
          this.magLogRepository.update([log], user)
        ),
      ]);

      const fetchedClient = this.getById(user, clientId);

      return fetchedClient;
    } catch (error) {
      console.error("Service Layer Error updating Client Name:", error);
      throw error;
    }
  }

  async delete(user: User, clientId: string): Promise<number[]> {
    try {
      const deletedCount = await this.clientRepository.delete(user, clientId);
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
