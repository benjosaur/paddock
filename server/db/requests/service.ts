import { ClientRequest } from "shared";
import { RequestRepository } from "./repository";
import { DbClientRequestEntity } from "./schema";

export class RequestService {
  requestRepository = new RequestRepository();

  async getAll(): Promise<ClientRequest[]> {
    const requestsFromDb = await this.requestRepository.getAll();
    const transformedRequests = this.transformDbRequestToShared(requestsFromDb);
    return transformedRequests;
  }

  async getByClientId(clientId: string): Promise<ClientRequest[]> {
    const requestsFromDb = await this.requestRepository.getByClientId(clientId);
    const transformedRequests = this.transformDbRequestToShared(requestsFromDb);
    return transformedRequests;
  }

  async getByStartDateBefore(startDate: string): Promise<ClientRequest[]> {
    const requestsFromDb = await this.requestRepository.getByStartDateBefore(
      startDate
    );
    const transformedRequests = this.transformDbRequestToShared(requestsFromDb);
    return transformedRequests;
  }

  async getById(
    clientId: string,
    requestId: string
  ): Promise<ClientRequest | null> {
    const requestFromDb = await this.requestRepository.getById(
      clientId,
      requestId
    );
    if (!requestFromDb) {
      return null;
    }
    const transformedRequest = this.transformDbRequestToShared([requestFromDb]);
    return transformedRequest[0];
  }

  async create(
    request: Omit<ClientRequest, "id">,
    userId: string
  ): Promise<ClientRequest> {
    try {
      const requestToCreate: Omit<DbClientRequestEntity, "sK"> = {
        pK: request.clientId,
        entityType:
          request.requestType == "mp"
            ? "clientMpRequest"
            : "clientVolunteerRequest",
        entityOwner: "client",
        date: request.startDate,
        details: request.details,
      };
      const createdRequestId = await this.requestRepository.create(
        requestToCreate,
        userId
      );

      const fetchedRequest = await this.getById(
        request.clientId,
        createdRequestId
      );
      if (!fetchedRequest) {
        throw new Error("Failed to fetch created client request");
      }

      const { id, ...restFetched } = fetchedRequest;

      if (JSON.stringify(request) !== JSON.stringify(restFetched)) {
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

  async update(request: ClientRequest, userId: string): Promise<ClientRequest> {
    try {
      const dbRequest: DbClientRequestEntity = {
        pK: request.clientId,
        sK: request.id,
        entityType:
          request.requestType == "mp"
            ? "clientMpRequest"
            : "clientVolunteerRequest",
        entityOwner: "client",
        date: request.startDate,
        details: request.details,
      };

      await this.requestRepository.update(dbRequest, userId);

      const fetchedRequest = await this.getById(request.clientId, request.id);
      if (!fetchedRequest) {
        throw new Error("Failed to fetch updated client request");
      }

      if (JSON.stringify(request) !== JSON.stringify(fetchedRequest)) {
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

  async delete(clientId: string, requestId: string): Promise<number[]> {
    try {
      const deletedCount = await this.requestRepository.delete(
        clientId,
        requestId
      );
      return deletedCount;
    } catch (error) {
      console.error("Service Layer Error deleting client request:", error);
      throw error;
    }
  }

  private transformDbRequestToShared(
    items: DbClientRequestEntity[]
  ): ClientRequest[] {
    return items.map((item) => ({
      id: item.sK,
      clientId: item.pK,
      requestType: item.entityType == "clientMpRequest" ? "mp" : "volunteer",
      startDate: item.date,
      details: item.details,
    }));
  }
}
