import {
  RequestFull,
  RequestMetadata,
  requestMetadataSchema,
  requestFullSchema,
  EndRequestDetails,
} from "shared";
import { RequestRepository } from "./repository";
import { DbRequest, DbRequestEntity } from "./schema";
import { DbReqPackage } from "../package/schema";
import { PackageRepository } from "../package/repository";
import { PackageService } from "../package/service";
import { firstYear } from "shared/const";
import { addDbMiddleware } from "../service";
import { genericUpdate } from "../repository";

export class RequestService {
  requestRepository = new RequestRepository();
  packageRepository = new PackageRepository();
  packageService = new PackageService();

  async getAllWithoutInfoWithPackages(user: User): Promise<RequestFull[]> {
    // without info
    try {
      const requestsFromDb = await this.requestRepository.getAll(user);
      const requestsWithoutInfo = requestsFromDb.filter(
        (req) => !req.details.services.includes("Information")
      );
      const packagesFromDb = await this.packageRepository.getAll(user);
      const packagesWithoutInfoAndWithoutSole = packagesFromDb.filter(
        (pkg): pkg is DbReqPackage =>
          !pkg.details.services.some((s) => s === "Information") &&
          "requestId" in pkg
      );
      const transformedRequests = this.transformDbRequestToSharedFull([
        ...requestsWithoutInfo,
        ...packagesWithoutInfoAndWithoutSole,
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

  async getAllWithoutInfoNotEndedYetWithPackages(
    user: User
  ): Promise<RequestFull[]> {
    try {
      const requestsFromDb = await this.requestRepository.getAllNotEndedYet(
        user
      );
      const requestsWithoutInfo = requestsFromDb.filter(
        (req) => !req.details.services.includes("Information")
      );
      const packagesFromDb = await this.packageRepository.getAllNotEndedYet(
        user
      );
      const packagesWithoutInfoAndWithoutSole = packagesFromDb.filter(
        (pkg): pkg is DbReqPackage =>
          !pkg.details.services.some((s) => s === "Information") &&
          "requestId" in pkg
      );
      const transformedRequests = this.transformDbRequestToSharedFull([
        ...requestsWithoutInfo,
        ...packagesWithoutInfoAndWithoutSole,
      ]);
      console.log(transformedRequests[50]);
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

  async getAllInfoMetadata(
    user: User,
    startYear: number = firstYear
  ): Promise<RequestMetadata[]> {
    try {
      // no packages
      const requestsFromDb = await this.requestRepository.getAll(
        user,
        startYear
      );
      const requestsWithInfo = requestsFromDb.filter((req) =>
        req.details.services.includes("Information")
      );
      const transformedRequests =
        this.transformDbRequestToSharedFull(requestsWithInfo);
      const parsedResult = requestMetadataSchema
        .array()
        .parse(transformedRequests);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all request metadata:", error);
      throw error;
    }
  }

  async getAllMetadataWithoutInfo(
    user: User,
    startYear: number = firstYear
  ): Promise<RequestMetadata[]> {
    try {
      // no packages
      const requestsFromDb = await this.requestRepository.getAll(
        user,
        startYear
      );
      const requestsWithoutInfo = requestsFromDb.filter(
        (req) => !req.details.services.includes("Information")
      );
      const transformedRequests =
        this.transformDbRequestToSharedFull(requestsWithoutInfo);
      const parsedResult = requestMetadataSchema
        .array()
        .parse(transformedRequests);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all request metadata:", error);
      throw error;
    }
  }

  async getAllMetadataWithoutInfoNotEndedYet(
    user: User
  ): Promise<RequestMetadata[]> {
    try {
      const requestsFromDb = await this.requestRepository.getAllNotEndedYet(
        user
      );
      const requestsWithoutInfo = requestsFromDb.filter(
        (req) => !req.details.services.includes("Information")
      );
      const transformedRequests =
        this.transformDbRequestToSharedFull(requestsWithoutInfo);
      const parsedResult = requestMetadataSchema
        .array()
        .parse(transformedRequests);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting all not ended request metadata:",
        error
      );
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

  async getRequestWithOnePackageByPackageId(
    packageId: string,
    user: User
  ): Promise<RequestFull> {
    try {
      const packageFromDb = await this.packageService.getById(packageId, user);
      if (!("requestId" in packageFromDb)) {
        throw new Error("Package does not belong to a request");
      }
      const requestId = packageFromDb.requestId;
      const requestFull = await this.getById(requestId, user);
      const filteredRequest: RequestFull = {
        ...requestFull,
        packages:
          requestFull.packages?.filter((pkg) => pkg.id === packageId) || [],
      };
      return filteredRequest;
    } catch (error) {
      console.error(
        "Service Layer Error getting request by package ID:",
        error
      );
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

  async endRequestAndPackages(
    user: User,
    endRequestDetails: EndRequestDetails
  ): Promise<void> {
    try {
      const requestWithPackagesRecords = await this.requestRepository.getById(
        endRequestDetails.requestId,
        user
      );

      const requestSuffix = endRequestDetails.endDate.slice(0, 4);

      const updatedRequestRecords = requestWithPackagesRecords.map((record) => {
        const currentEnd = record.endDate;
        const shouldUpdate =
          currentEnd === "open" ||
          new Date(endRequestDetails.endDate) < new Date(currentEnd);

        let newEntityType;
        if (shouldUpdate && record.sK.startsWith("req")) {
          newEntityType = `request#${requestSuffix}`;
        } else if (shouldUpdate && record.sK.startsWith("pkg")) {
          newEntityType = `package#${requestSuffix}`;
        } else {
          newEntityType = record.entityType;
        }

        return addDbMiddleware(
          {
            ...record,
            entityType: newEntityType,
            endDate: shouldUpdate ? endRequestDetails.endDate : currentEnd,
          },
          user
        );
      });

      await genericUpdate(updatedRequestRecords, user);
    } catch (error) {
      console.error("Service Layer Error ending request:", error);
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
        const { pK, sK, entityType, ...rest } = item as DbReqPackage; // sole packages wont be fetched on this req id GSI request (Dont have req ids)
        request.packages.push({ ...rest, id: sK, carerId: pK });
      } else {
        throw new Error(`Undefined Case: ${item}`);
      }
    }

    return Array.from(requestsMap.values()) as RequestFull[];
  }
}
