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

  async create(request: Omit<ClientRequest, "id">): Promise<ClientRequest> {
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
      const createdRequest = await this.requestRepository.create(
        requestToCreate
      );
      const transformedRequest =
        this.transformDbRequestToShared(createdRequest);
      return transformedRequest[0];
    } catch (error) {
      console.error("Service Layer Error creating client request:", error);
      throw error;
    }
  }

  async update(request: ClientRequest): Promise<ClientRequest> {
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

      const updatedRequest = await this.requestRepository.update(dbRequest);
      const transformedRequest =
        this.transformDbRequestToShared(updatedRequest);
      return transformedRequest[0];
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
