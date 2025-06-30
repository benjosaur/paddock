import { ClientService } from "./client/service";
import { MpService } from "./mp/service";
import { MpLogService } from "./mplog/service";
import { VolunteerService } from "./volunteer/service";
import { VolunteerLogService } from "./vlog/service";
import { MagLogService } from "./mag/service";
import { TrainingRecordService } from "./training/service";

const clientService = new ClientService();
const mpService = new MpService();
const volunteerService = new VolunteerService();
const mpLogService = new MpLogService();
const volunteerLogService = new VolunteerLogService();
const magLogService = new MagLogService();
const trainingRecordService = new TrainingRecordService();

console.dir(await clientService.getAll(), { depth: null });
console.dir(await clientService.getById("c#1"), { depth: null });
console.dir(await mpService.getAll(), { depth: null });
console.dir(await mpService.getById("mp#1"), { depth: null });
console.dir(await volunteerService.getAll(), { depth: null });
console.dir(await volunteerService.getById("v#1"), { depth: null });
console.dir(await mpLogService.getAll(), { depth: null });
console.dir(await mpLogService.getById("mplog#1"), { depth: null });
console.dir(await mpLogService.getBySubstring("ey"), { depth: null });
console.dir(await mpLogService.getByMpId("mp#1"), { depth: null });
console.dir(await mpLogService.getByMpId("mp#1"), { depth: null });
console.dir(
  await mpLogService.getByDateInterval({
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2026-01-31T23:59:59Z",
  }),
  { depth: null }
);
console.dir(await volunteerLogService.getAll(), { depth: null });
console.dir(await volunteerLogService.getById("vlog#1"), { depth: null });
console.dir(await volunteerLogService.getBySubstring("ey"), { depth: null });
console.dir(await volunteerLogService.getByVolunteerId("v#1"), { depth: null });
console.dir(
  await volunteerLogService.getByDateInterval({
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2026-01-31T23:59:59Z",
  }),
  { depth: null }
);
console.dir(await magLogService.getAll(), { depth: null });
console.dir(await magLogService.getById("mag#1"), { depth: null });
console.dir(
  await magLogService.getByDateInterval({
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2026-01-31T23:59:59Z",
  }),
  { depth: null }
);
console.dir(await trainingRecordService.getAll(), { depth: null });
console.dir(
  await trainingRecordService.getByExpiringBefore("2026-01-31T23:59:59Z"),
  { depth: null }
);
