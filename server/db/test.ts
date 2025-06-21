import { ClientService } from "./client/service";

const service = new ClientService();

console.log(await service.getAll());
console.log(await service.getById("c#1"));
