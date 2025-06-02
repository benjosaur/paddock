import { router } from "./trpc.ts";
import { mpsRouter } from "./routers/mps.ts";
import { volunteersRouter } from "./routers/volunteers.ts";
import { clientsRouter } from "./routers/clients.ts";
import { mpLogsRouter } from "./routers/mpLogs.ts";
import { volunteerLogsRouter } from "./routers/volunteerLogs.ts";
import { magLogsRouter } from "./routers/magLogs.ts";
import { clientRequestsRouter } from "./routers/clientRequests.ts";

export const appRouter = router({
  mps: mpsRouter,
  volunteers: volunteersRouter,
  clients: clientsRouter,
  mpLogs: mpLogsRouter,
  volunteerLogs: volunteerLogsRouter,
  magLogs: magLogsRouter,
  clientRequests: clientRequestsRouter,
});

export type AppRouter = typeof appRouter;
