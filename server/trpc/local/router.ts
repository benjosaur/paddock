import { localRouter } from "./trpc";
import { mpsRouter } from "../routers/mps";
import { volunteersRouter } from "../routers/volunteers";
import { clientsRouter } from "../routers/clients";
import { mpLogsRouter } from "../routers/mpLogs";
import { volunteerLogsRouter } from "../routers/volunteerLogs";
import { magLogsRouter } from "../routers/magLogs";
import { clientRequestsRouter } from "../routers/clientRequests";
import { trainingRecordsRouter } from "../routers/trainingRecords";

export const localAppRouter = localRouter({
  mps: mpsRouter,
  volunteers: volunteersRouter,
  clients: clientsRouter,
  mpLogs: mpLogsRouter,
  volunteerLogs: volunteerLogsRouter,
  magLogs: magLogsRouter,
  clientRequests: clientRequestsRouter,
  trainingRecords: trainingRecordsRouter,
});
