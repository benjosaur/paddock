import {
  RequestFull,
  RequestMetadata,
  requestFullSchema,
  requestMetadataSchema,
} from "shared";
import { RequestRepository } from "./repository";
import { DbRequest, DbRequestEntity } from "./schema";
import { DbPackage } from "../package/schema";
import { PackageRepository } from "../package/repository";
import { PackageService } from "../package/service";
import { fi } from "zod/v4/locales";

export class RequestService {
  requestRepository = new RequestRepository();
  packageRepository = new PackageRepository();
  packageService = new PackageService();

  async getAllActiveWithPackages(user: User): Promise<RequestFull[]> {
    // no packages
    const requestsFromDb = await this.requestRepository.getAllActive(user);
    const packagesFromDb = await this.packageRepository.getAllActive(user);
    const transformedRequests = this.transformDbRequestToSharedFull([
      ...requestsFromDb,
      ...packagesFromDb,
    ]);
    return transformedRequests;
  }

  async getAllMetadata(user: User): Promise<RequestMetadata[]> {
    // no packages
    const requestsFromDb = await this.requestRepository.getAll(user);
    const transformedRequests =
      this.transformDbRequestToSharedFull(requestsFromDb);
    return transformedRequests;
  }

  async getById(requestId: string, user: User): Promise<RequestFull | null> {
    const requestFromDb = await this.requestRepository.getById(user, requestId);
    if (!requestFromDb) {
      return null;
    }
    const transformedRequest = this.transformDbRequestToSharedFull([
      requestFromDb,
    ]);
    const packages = this.packageService.getByRequestId(requestId);
    const fullRequest = transformedRequest[0];
    fullRequest.packages = packages;
    return fullRequest;
  }

  async getByStartDateBefore(
    user: User,
    startDate: string
  ): Promise<Request[]> {
    const requestsFromDb = await this.requestRepository.getByStartDateBefore(
      user,
      startDate
    );
    const transformedRequests = this.transformDbRequestToShared(requestsFromDb);
    return transformedRequests;
  }

  async create(request: Omit<Request, "id">, user: User): Promise<Request> {
    try {
      const validatedInput = requestSchema.omit({ id: true }).parse(request);

      const requestToCreate: Omit<DbRequest, "sK"> = {
        pK: validatedInput.clientId,
        entityType:
          validatedInput.requestType == "mp"
            ? "clientMpRequest"
            : "clientVolunteerRequest",
        entityOwner: "client",
        date: validatedInput.startDate,
        details: validatedInput.details,
      };
      const createdRequestId = await this.requestRepository.create(
        requestToCreate,
        user
      );

      const fetchedRequest = await this.getById(
        user,
        validatedInput.clientId,
        createdRequestId
      );
      if (!fetchedRequest) {
        throw new Error("Failed to fetch created client request");
      }

      const { id, ...restFetched } = fetchedRequest;

      if (JSON.stringify(validatedInput) !== JSON.stringify(restFetched)) {
        throw new Error(
          "Created client request does not match expected values"
        );
      }

      return fetchedRequest;
    } catch (error) {
      console.error("Service Layer Error creating client request:", error);
      throw error;
    }
  }

  async update(request: Request, user: User): Promise<Request> {
    try {
      const validatedInput = requestSchema.parse(request);

      const dbRequest: DbRequest = {
        pK: validatedInput.clientId,
        sK: validatedInput.id,
        entityType:
          validatedInput.requestType == "mp"
            ? "clientMpRequest"
            : "clientVolunteerRequest",
        entityOwner: "client",
        date: validatedInput.startDate,
        details: validatedInput.details,
      };

      await this.requestRepository.update(dbRequest, user);

      const fetchedRequest = await this.getById(
        user,
        validatedInput.clientId,
        validatedInput.id
      );
      if (!fetchedRequest) {
        throw new Error("Failed to fetch updated client request");
      }

      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedRequest)) {
        throw new Error(
          "Updated client request does not match expected values"
        );
      }

      return fetchedRequest;
    } catch (error) {
      console.error("Service Layer Error updating client request:", error);
      throw error;
    }
  }

  async delete(
    user: User,
    clientId: string,
    requestId: string
  ): Promise<number[]> {
    try {
      const deletedCount = await this.requestRepository.delete(
        user,
        clientId,
        requestId
      );
      return deletedCount;
    } catch (error) {
      console.error("Service Layer Error deleting client request:", error);
      throw error;
    }
  }

  private transformDbRequestToSharedFull(items: DbRequest[]): RequestFull[] {
    const requestsMap = new Map<string, Partial<RequestFull>>();

    for (const item of items) {
      const requestId = item.pK;

      if (!requestsMap.has(requestId)) {
        requestsMap.set(requestId, {
          id: requestId,
        });
      }

      let request = requestsMap.get(requestId)!;

      if (item.sK.startsWith("req")) {
        const { pK, sK, entityType, ...rest } = item as DbRequestEntity;
        Object.assign(request, rest);
      } else if (item.sK.startsWith("pkg")) {
        if (!request.packages) request.packages = [];
        const { pK, sK, entityType, ...rest } = item as DbPackage;
        request.packages.push({ ...rest, id: sK, carerId: pK });
      } else {
        throw new Error(`Undefined Case: ${item}`);
      }
    }

    return Array.from(requestsMap.values()) as RequestFull[];
  }
}
