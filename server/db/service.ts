import { ClientService } from "./client/service";
import { MagLogService } from "./mag/service";
import { MpService } from "./mp/service";
import { PackageService } from "./package/service";
import { RequestService } from "./requests/service";
import { TrainingRecordService } from "./training/service";
import { VolunteerService } from "./volunteer/service";
import { ReportService } from "./analytics/service";

export function addDbMiddleware<T>(
  input: T,
  user: User
): T & { updatedAt: string; updatedBy: string } {
  const now = new Date().toISOString();
  return {
    ...input,
    updatedAt: now,
    updatedBy: user.sub,
  };
}

export function createServices() {
  return {
    client: new ClientService(),
    magLog: new MagLogService(),
    mp: new MpService(),
    packages: new PackageService(),
    volunteer: new VolunteerService(),
    requests: new RequestService(),
    training: new TrainingRecordService(),
    analytics: new ReportService(),
  };
}
