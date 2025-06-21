import { ClientService } from "./client/service";
import { MpService } from "./mp/service";
import { MpLogService } from "./mplog/service";
import { VolunteerService } from "./volunteer/service";

const clientService = new ClientService();
const mpService = new MpService();
const volunteerService = new VolunteerService();
const mpLogService = new MpLogService();

// console.log(await clientService.getAll());
// console.log(await clientService.getById("c#1"));
// console.log(await mpService.getAll());
// console.log(await mpService.getById("mp#1"));
// console.log(await volunteerService.getAll());
// console.log(await volunteerService.getById("v#1"));
// console.log(await mpLogService.getAll());
console.log(await mpLogService.getById("mplog#1"));
