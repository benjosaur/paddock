import { RequestFull, RequestMetadata, requestMetadataSchema } from "shared";
import { RequestRepository } from "./repository";
import { DbRequest, DbRequestEntity } from "./schema";
import { DbPackage } from "../package/schema";
import { PackageRepository } from "../package/repository";
import { PackageService } from "../package/service";

export class RequestService {
  requestRepository = new RequestRepository();
  packageRepository = new PackageRepository();
  packageService = new PackageService();

  async getAllNotArchivedWithPackages(user: User): Promise<RequestFull[]> {
    const requestsFromDb = await this.requestRepository.getAllNotArchived(user);
    const packagesFromDb = await this.packageRepository.getAllNotArchived(user);
    const transformedRequests = this.transformDbRequestToSharedFull([
      ...requestsFromDb,
      ...packagesFromDb,
    ]);
    return transformedRequests;
  }

  async getAllThisYearWithPackages(user: User): Promise<RequestFull[]> {
    const requestsFromDb = await this.requestRepository.getAllThisYear(user);
    // below as we want all packages associated with the request (though archived wont be fetched)
    const packagesFromDb = await this.packageRepository.getAllNotArchived(user);
    const transformedRequests = this.transformDbRequestToSharedFull([
      ...requestsFromDb,
      ...packagesFromDb,
    ]);
    return transformedRequests;
  }

  async getAllMetadata(
    startYear: number | null,
    user: User
  ): Promise<RequestMetadata[]> {
    // no packages
    const requestsFromDb = await this.requestRepository.getAll(startYear, user);
    const transformedRequests =
      this.transformDbRequestToSharedFull(requestsFromDb);
    return transformedRequests;
  }

  async getById(requestId: string, user: User): Promise<RequestFull> {
    const requestFromDb = await this.requestRepository.getById(requestId, user);
    const transformedRequest =
      this.transformDbRequestToSharedFull(requestFromDb);
    const fullRequest = transformedRequest[0];
    return fullRequest;
  }

  async create(
    request: Omit<RequestMetadata, "id" | "requestId">,
    user: User
  ): Promise<string> {
    try {
      const validatedInput = requestMetadataSchema
        .omit({ id: true })
        .parse(request);
      const requestSuffix = validatedInput.endDate.slice(0, 4); // open or yyyy
      const { clientId, ...rest } = validatedInput;
      const requestToCreate: Omit<DbRequestEntity, "sK" | "requestId"> = {
        pK: clientId,
        entityType: `request#${requestSuffix}`,
        ...rest,
      };
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

  async update(request: Request, user: User): Promise<void> {
    try {
      const validatedInput = requestMetadataSchema.parse(request);
      const { id, clientId, ...rest } = validatedInput;
      const requestSuffix = validatedInput.endDate.slice(0, 4); // open or yyyy
      const dbRequest: DbRequestEntity = {
        pK: clientId,
        sK: id,
        requestId: id,
        entityType: `request#${requestSuffix}`,
        ...rest,
      };

      await this.requestRepository.update(dbRequest, user);
    } catch (error) {
      console.error(" Service Layer Error updating client request:", error);
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
