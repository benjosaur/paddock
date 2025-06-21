import { ClientService } from "./client/service";
import { MpService } from "./mp/service";

const clientService = new ClientService();
const mpService = new MpService();

// console.log(await clientService.getAll());
// console.log(await clientService.getById("c#1"));
// console.log(await mpService.getAll());
console.log(await mpService.getById("mp#1"));
