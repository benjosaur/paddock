import {
  RequestFull,
  RequestMetadata,
  requestMetadataSchema,
  requestFullSchema,
} from "shared";
import { RequestRepository } from "./repository";
import { DbRequest, DbRequestEntity } from "./schema";
import { DbPackage } from "../package/schema";
import { PackageRepository } from "../package/repository";
import { PackageService } from "../package/service";
import { firstYear } from "shared/const";
import { addDbMiddleware } from "../service";
import { genericUpdate } from "../repository";

export class RequestService {
  requestRepository = new RequestRepository();
  packageRepository = new PackageRepository();
  packageService = new PackageService();

  async getAllWithPackages(user: User): Promise<RequestFull[]> {
    try {
      const requestsFromDb = await this.requestRepository.getAll(user);
      const packagesFromDb = await this.packageRepository.getAll(user);
      const transformedRequests = this.transformDbRequestToSharedFull([
        ...requestsFromDb,
        ...packagesFromDb,
      ]);
      const parsedResult = requestFullSchema.array().parse(transformedRequests);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting all requests with packages:",
        error
      );
      throw error;
    }
  }

  async getAllNotArchivedWithPackages(user: User): Promise<RequestFull[]> {
    try {
      const requestsFromDb = await this.requestRepository.getAllNotArchived(
        user
      );
      const packagesFromDb = await this.packageRepository.getAllNotArchived(
        user
      );
      const transformedRequests = this.transformDbRequestToSharedFull([
        ...requestsFromDb,
        ...packagesFromDb,
      ]);
      const parsedResult = requestFullSchema.array().parse(transformedRequests);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting all non-archived requests with packages:",
        error
      );
      throw error;
    }
  }

  async getAllNotEndedYetWithPackages(user: User): Promise<RequestFull[]> {
    try {
      const requestsFromDb = await this.requestRepository.getAllNotEndedYet(
        user
      );
      // below as we want all packages associated with the request (though archived wont be fetched)
      const packagesFromDb = await this.packageRepository.getAllNotArchived(
        user
      );
      const transformedRequests = this.transformDbRequestToSharedFull([
        ...requestsFromDb,
        ...packagesFromDb,
      ]);
      const parsedResult = requestFullSchema.array().parse(transformedRequests);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting all not ended requests with packages:",
        error
      );
      throw error;
    }
  }

  async getAllMetadata(
    user: User,
    startYear: number = firstYear
  ): Promise<RequestMetadata[]> {
    try {
      // no packages
      const requestsFromDb = await this.requestRepository.getAll(
        user,
        startYear
      );
      const transformedRequests =
        this.transformDbRequestToSharedFull(requestsFromDb);
      const parsedResult = requestMetadataSchema
        .array()
        .parse(transformedRequests);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all request metadata:", error);
      throw error;
    }
  }

  async getById(requestId: string, user: User): Promise<RequestFull> {
    try {
      const requestFromDb = await this.requestRepository.getById(
        requestId,
        user
      );
      const transformedRequest =
        this.transformDbRequestToSharedFull(requestFromDb);
      const parsedResult = requestFullSchema.array().parse(transformedRequest);
      const fullRequest = parsedResult[0];
      return fullRequest;
    } catch (error) {
      console.error("Service Layer Error getting request by ID:", error);
      throw error;
    }
  }

  async create(
    request: Omit<RequestMetadata, "id">,
    user: User
  ): Promise<string> {
    try {
      const validatedInput = requestMetadataSchema
        .omit({ id: true })
        .parse(request);
      const requestSuffix = validatedInput.endDate.slice(0, 4); // open or yyyy
      const { clientId, ...rest } = validatedInput;
      const requestToCreate: Omit<DbRequestEntity, "sK" | "requestId"> =
        addDbMiddleware(
          {
            pK: clientId,
            entityType: `request#${requestSuffix}`,
            ...rest,
          },
          user
        );
      const createdRequestId = await this.requestRepository.create(
        requestToCreate,
        user
      );

      return createdRequestId;
    } catch (error) {
      console.error("Service Layer Error creating client request:", error);
      throw error;
    }
  }

  async update(request: RequestMetadata, user: User): Promise<void> {
    try {
      const validatedInput = requestMetadataSchema.parse(request);
      const { id, clientId, ...rest } = validatedInput;
      const requestSuffix = validatedInput.endDate.slice(0, 4); // open or yyyy
      const dbRequest: DbRequestEntity = addDbMiddleware(
        {
          pK: clientId,
          sK: id,
          requestId: id,
          entityType: `request#${requestSuffix}`,
          ...rest,
        },
        user
      );

      await this.requestRepository.update(dbRequest, user);
    } catch (error) {
      console.error(" Service Layer Error updating client request:", error);
      throw error;
    }
  }

  async renew(
    oldRequest: RequestMetadata,
    renewedRequest: Omit<RequestMetadata, "id">,
    user: User
  ): Promise<void> {
    // This function renews a request by setting its old version's end date to ended
    // but brings forward the packages to new req id.
    try {
      const validatedOldRequest = requestMetadataSchema.parse(oldRequest);
      const validatedRenewedRequest = requestMetadataSchema
        .omit({ id: true })
        .parse(renewedRequest);

      // Create new request
      const newRequestId = await this.create(validatedRenewedRequest, user);

      // Update old request, the reset end date logic will occur in frontend.
      await this.update(validatedOldRequest, user);

      const oldRequestWithPackages = await this.requestRepository.getById(
        oldRequest.id,
        user
      );
      const updatedRecords = oldRequestWithPackages.map((record) => {
        if (record.sK.startsWith("req")) {
          return addDbMiddleware(record, user);
        } else if (record.sK.startsWith("pkg")) {
          // For packages, we need to update the requestId to the new requestId
          return addDbMiddleware(
            {
              ...record,
              requestId: newRequestId,
            },
            user
          );
        } else {
          throw new Error(`Undefined Case: ${record}`);
        }
      });

      await genericUpdate(updatedRecords, user);
    } catch (error) {
      console.error("Service Layer Error renewing request:", error);
      throw error;
    }
  }

  async delete(user: User, requestId: string): Promise<number> {
    try {
      const numDeleted = await this.requestRepository.delete(requestId, user);
      return numDeleted[0];
    } catch (error) {
      console.error("Service Layer Error deleting request:", error);
      throw error;
    }
  }

  async toggleArchive(requestId: string, user: User): Promise<void> {
    try {
      const requestWithPackagesRecords = await this.requestRepository.getById(
        requestId,
        user
      );

      const updatedRequestRecords = requestWithPackagesRecords.map(
        (record) => ({
          ...record,
          archived: record.archived === "Y" ? "N" : "Y",
        })
      );

      await genericUpdate(updatedRequestRecords, user);
    } catch (error) {
      console.error("Service Layer Error toggling request archive:", error);
      throw error;
    }
  }

  private transformDbRequestToSharedFull(items: DbRequest[]): RequestFull[] {
    const requestsMap = new Map<string, Partial<RequestFull>>();

    for (const item of items) {
      const requestId = item.requestId;

      if (!requestsMap.has(requestId)) {
        requestsMap.set(requestId, {
          id: requestId,
        });
      }

      let request = requestsMap.get(requestId)!;
      if (item.sK.startsWith("req")) {
        const { pK, sK, entityType, ...rest } = item as DbRequestEntity;
        Object.assign(request, { ...rest, clientId: pK });
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
