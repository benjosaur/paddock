import {
  ClientFull,
  clientFullSchema,
  ClientMetadata,
  clientMetadataSchema,
  InfoDetails,
  infoDetailsSchema,
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
import { addDbMiddleware } from "../service";
import { DeprivationService } from "../../services/deprivation";
import { EndPersonDetails, endPersonDetailsSchema } from "shared";
import { VolunteerService } from "../volunteer/service";

export class ClientService {
  clientRepository = new ClientRepository();
  magLogService = new MagLogService();
  requestService = new RequestService();
  packageService = new PackageService();
  packageRepository = new PackageRepository();
  magLogRepository = new MagLogRepository();
  requestRepository = new RequestRepository();
  deprivationService = new DeprivationService();
  volunteerService = new VolunteerService();

  // Archived concept removed in favor of end dates. Use getAll and filter by endDate where needed.

  async getAll(user: User): Promise<ClientMetadata[]> {
    try {
      const dbClients = await this.clientRepository.getAll(user);
      const dbRequests = await this.requestRepository.getAll(user);
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

  async getAllNotEnded(user: User): Promise<ClientMetadata[]> {
    try {
      const dbClients = await this.clientRepository.getAllNotEnded(user);
      const transformedResult =
        this.transformDbClientToSharedMetaData(dbClients);
      const parsedResult = clientMetadataSchema
        .array()
        .parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting all not ended clients:",
        error
      );
      throw error;
    }
  }

  async getAllWithMagService(user: User): Promise<ClientMetadata[]> {
    try {
      const dbClients = await this.clientRepository.getAllWithMagService(user);
      const dbRequests = await this.requestRepository.getAll(user);
      const transformedResult = this.transformDbClientToSharedMetaData([
        ...dbClients,
        ...dbRequests,
      ]);
      // transformed results will include partial non-mag clients (with only id and requests) as requests fetches all, so parsing will fail.
      const parsedResult = transformedResult
        .map((client) => clientMetadataSchema.safeParse(client))
        .filter((result) => result.success)
        .map((result) => result.data);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting MAG clients:", error);
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

  async create(
    newClient: Omit<ClientMetadata, "id">,
    user: User
  ): Promise<{
    clientId: string;
    deprivationData: {
      matched: boolean;
      income: boolean;
      health: boolean;
    };
    postcode: string;
  }> {
    try {
      const validatedInput = clientMetadataSchema
        .omit({ id: true })
        .parse(newClient);

      let clientWithDeprivation;
      let deprivationData = { matched: false, income: false, health: false };
      if (validatedInput.details.address.postCode) {
        // Fetch deprivation data for the client's postcode
        deprivationData = await this.deprivationService.getDeprivationData(
          validatedInput.details.address.postCode
        );

        // Update the client with deprivation data
        clientWithDeprivation = {
          ...validatedInput,
          details: {
            ...validatedInput.details,
            address: {
              ...validatedInput.details.address,
              deprivation: deprivationData,
            },
          },
        };
      } else {
        clientWithDeprivation = validatedInput;
      }

      const clientToCreate: Omit<DbClientEntity, "pK" | "sK"> = addDbMiddleware(
        {
          ...clientWithDeprivation,
          entityType: "client",
        },
        user
      );

      const createdClientId = await this.clientRepository.create(
        clientToCreate,
        user
      );

      return {
        clientId: createdClientId,
        deprivationData,
        postcode: validatedInput.details.address.postCode,
      };
    } catch (error) {
      console.error("Service Layer Error creating client:", error);
      throw error;
    }
  }

  async createInfoEntry(
    client: ClientMetadata,
    infoDetails: InfoDetails,
    user: User
  ): Promise<string[]> {
    try {
      const validatedClient = clientMetadataSchema.parse(client);
      const validatedInfoDetails = infoDetailsSchema.parse(infoDetails);
      const newRequestId = await this.requestService.create(
        {
          clientId: client.id,
          startDate: validatedInfoDetails.date,
          endDate: validatedInfoDetails.date,
          requestType: "unpaid",
          details: {
            ...validatedClient.details,
            weeklyHours: 0,
            oneOffStartDateHours: validatedInfoDetails.minutesTaken / 60,
            notes: "",
            status: "normal",
            services: [...validatedInfoDetails.services, "Information"],
          },
        },
        user
      );

      const newPackageId = await this.packageService.create(
        {
          carerId: validatedInfoDetails.completedBy.id,
          requestId: newRequestId,
          startDate: validatedInfoDetails.date,
          endDate: validatedInfoDetails.date,
          details: {
            address: validatedClient.details.address,
            name: validatedInfoDetails.completedBy.name,
            weeklyHours: 0,
            oneOffStartDateHours: validatedInfoDetails.minutesTaken / 60,
            services: [...validatedInfoDetails.services, "Information"],
            notes: "",
          },
        },
        user
      );

      if (validatedInfoDetails.note) {
        const dbClientWithUpdatedNotes: DbClientEntity = addDbMiddleware(
          {
            ...validatedClient,
            pK: validatedClient.id,
            sK: validatedClient.id,
            entityType: "client",
            details: {
              ...validatedClient.details,
              notes: [...validatedClient.details.notes, validatedInfoDetails],
            },
          },
          user
        );
        await this.clientRepository.update(dbClientWithUpdatedNotes, user);
      }

      return [newRequestId, newPackageId];
    } catch (error) {
      console.error("Service Layer Error creating info entry:", error);
      throw error;
    }
  }

  async update(updatedClient: ClientMetadata, user: User): Promise<void> {
    //note for name or postcode (only metachanges)
    try {
      const validatedInput = clientMetadataSchema.parse(updatedClient);
      const { id, ...rest } = validatedInput;

      const dbClient: DbClientEntity = addDbMiddleware(
        {
          pK: id,
          sK: id,
          entityType: "client",
          ...rest,
        },
        user
      );
      await this.clientRepository.update(dbClient, user);
    } catch (error) {
      console.error("Service Layer Error updating client:", error);
      throw error;
    }
  }

  async updatePostCode(
    updatedClient: ClientMetadata,
    newPostcode: string,
    user: User
  ): Promise<{
    deprivationData: {
      matched: boolean;
      income: boolean;
      health: boolean;
    };
    postcode: string;
  }> {
    // does not update associated records
    // instead of getting client by id just passs in the entire state of current form and update.
    try {
      const { id, requests, ...updatedClientMetadata } =
        clientMetadataSchema.parse(updatedClient);

      // Fetch deprivation data for the client's postcode
      const deprivationData = await this.deprivationService.getDeprivationData(
        newPostcode
      );

      // Update the client with deprivation data
      const clientWithDeprivation = {
        ...updatedClientMetadata,
        details: {
          ...updatedClientMetadata.details,
          address: {
            ...updatedClientMetadata.details.address,
            postCode: newPostcode,
            deprivation: deprivationData,
          },
        },
      };

      const dbClient: DbClientEntity = addDbMiddleware(
        {
          pK: id,
          sK: id,
          entityType: "client",
          ...clientWithDeprivation,
        },
        user
      );
      await this.clientRepository.update(dbClient, user);
      return { deprivationData, postcode: newPostcode };
    } catch (error) {
      console.error("Service Layer Error updating client:", error);
      throw error;
    }
  }

  async updateCustomId(
    updatedClient: ClientMetadata,
    newCustomId: string,
    user: User
  ): Promise<void> {
    // update reqs
    // now need to update any client metadata changes too
    try {
      const { id, requests, ...updatedClientMetadata } =
        clientMetadataSchema.parse(updatedClient);

      const updatedClientEntity: DbClientEntity = addDbMiddleware(
        {
          ...updatedClientMetadata,
          pK: id,
          sK: id,
          entityType: "client",
          details: { ...updatedClientMetadata.details, customId: newCustomId },
        },
        user
      );

      const initialClientRecords = await this.clientRepository.getById(
        id,
        user
      );

      //filter out mags (these dont contain customId)
      const updatedClientRecords = initialClientRecords
        .filter((record) => !record.sK.startsWith("mag"))
        .map((record) => {
          if (record.sK.startsWith("c#")) {
            return updatedClientEntity;
          } else {
            return addDbMiddleware(
              {
                ...record,
                details: { ...record.details, customId: newCustomId },
              },
              user
            );
          }
        });
      await genericUpdate(updatedClientRecords, user);
    } catch (error) {
      console.error("Service Layer Error updating Client Custom ID:", error);
      throw error;
    }
  }

  async updateName(
    updatedClient: ClientMetadata,
    newName: string,
    user: User
  ): Promise<void> {
    // update mags and reqs
    try {
      const { id, requests, ...updatedClientMetadata } =
        clientMetadataSchema.parse(updatedClient);

      const updatedClientEntity: DbClientEntity = addDbMiddleware(
        {
          ...updatedClientMetadata,
          pK: id,
          sK: id,
          entityType: "client",
          details: { ...updatedClientMetadata.details, name: newName },
        },
        user
      );

      const initialClientRecords = await this.clientRepository.getById(
        id,
        user
      );
      const updatedClientRecords = initialClientRecords.map((record) => {
        if (record.sK.startsWith("c#")) {
          return updatedClientEntity;
        }

        return addDbMiddleware(
          {
            ...record,
            details: { ...record.details, name: newName },
          },
          user
        );
      });
      await genericUpdate(updatedClientRecords, user);
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

  async end(user: User, input: EndPersonDetails): Promise<void> {
    // TODO also end reqs and pkgs
    try {
      const validated = endPersonDetailsSchema.parse(input);
      const records = await this.clientRepository.getById(
        validated.personId,
        user
      );
      const transformedClient =
        this.transformDbClientToSharedMetaData(records)[0];
      if (!transformedClient) throw new Error("Client record not found");
      const validatedClient = clientMetadataSchema.parse(transformedClient);
      const { id, requests, ...rest } = validatedClient;
      const dbClient: DbClientEntity = addDbMiddleware(
        {
          ...rest,
          pK: id,
          sK: id,
          entityType: "client",
          endDate: validated.endDate,
        },
        user
      );
      const clientUpdate = this.clientRepository.update(dbClient, user);

      // end all reqs and pkgs

      const reqUpdates = requests.map((req) =>
        this.requestService.endRequestAndPackages(user, {
          requestId: req.id,
          endDate: validated.endDate,
        })
      );
      await Promise.all([clientUpdate, ...reqUpdates]);
    } catch (error) {
      console.error("Service Layer Error ending client:", error);
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
