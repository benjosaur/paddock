import { ArchiveRepository } from "./repository";
import { ClientRepository } from "../client/repository";
import { MpRepository } from "../mp/repository";
import { VolunteerRepository } from "../volunteer/repository";
import { DbClientEntity } from "../client/schema";
import { DbMpEntity } from "../mp/schema";
import { DbVolunteerEntity } from "../volunteer/schema";

export class ArchiveService {
  archiveRepository = new ArchiveRepository();
  clientRepository = new ClientRepository();
  mpRepository = new MpRepository();
  volunteerRepository = new VolunteerRepository();

  async toggleArchiveClient(clientId: string, user: User): Promise<void> {
    try {
      const clientRecords = await this.clientRepository.getById(clientId, user);
      const clientEntity = clientRecords.find(
        (record) => record.entityType === "client" && record.pK === record.sK
      ) as DbClientEntity | undefined;

      if (!clientEntity) {
        throw new Error("Client not found");
      }

      const updatedClient = {
        ...clientEntity,
        archived: clientEntity.archived === "Y" ? "N" : "Y",
      };

      await this.archiveRepository.toggleArchived(updatedClient, user);
    } catch (error) {
      console.error("Service Layer Error toggling client archive:", error);
      throw error;
    }
  }

  async toggleArchiveMp(mpId: string, user: User): Promise<void> {
    try {
      const mpRecords = await this.mpRepository.getById(mpId, user);
      const mpEntity = mpRecords.find(
        (record) => record.entityType === "mp" && record.pK === record.sK
      ) as DbMpEntity | undefined;

      if (!mpEntity) {
        throw new Error("MP not found");
      }

      const updatedMp = {
        ...mpEntity,
        archived: mpEntity.archived === "Y" ? "N" : "Y",
      };

      await this.archiveRepository.toggleArchived(updatedMp, user);
    } catch (error) {
      console.error("Service Layer Error toggling MP archive:", error);
      throw error;
    }
  }

  async toggleArchiveVolunteer(volunteerId: string, user: User): Promise<void> {
    try {
      const volunteerRecords = await this.volunteerRepository.getById(
        volunteerId,
        user
      );
      const volunteerEntity = volunteerRecords.find(
        (record) => record.entityType === "volunteer" && record.pK === record.sK
      ) as DbVolunteerEntity | undefined;

      if (!volunteerEntity) {
        throw new Error("Volunteer not found");
      }

      const updatedVolunteer = {
        ...volunteerEntity,
        archived: volunteerEntity.archived === "Y" ? "N" : "Y",
      };

      await this.archiveRepository.toggleArchived(updatedVolunteer, user);
    } catch (error) {
      console.error("Service Layer Error toggling volunteer archive:", error);
      throw error;
    }
  }
}
