import { router } from "./trpc";
import { mpsRouter } from "../routers/mps";
import { volunteersRouter } from "../routers/volunteers";
import { clientsRouter } from "../routers/clients";
import { packagesRouter } from "../routers/packages";
import { magRouter } from "../routers/mag";
import { requestsRouter } from "../routers/requests";
import { trainingRecordsRouter } from "../routers/trainingRecords";

export const prodAppRouter = router({
  mps: mpsRouter,
  volunteers: volunteersRouter,
  clients: clientsRouter,
  packages: packagesRouter,
  mag: magRouter,
  requests: requestsRouter,
  trainingRecords: trainingRecordsRouter,
});

export type AppRouter = typeof prodAppRouter;

export type AppRouterKeys = keyof typeof prodAppRouter;
