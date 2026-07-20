import { localRouter } from "./trpc";
import { attachmentsRouter } from "../routers/attachments";
import { mpsRouter } from "../routers/mps";
import { volunteersRouter } from "../routers/volunteers";
import { clientsRouter } from "../routers/clients";
import { packagesRouter } from "../routers/packages";
import { hubGrubRouter } from "../routers/hubGrub";
import { magRouter } from "../routers/mag";
import { requestsRouter } from "../routers/requests";
import { trainingRecordsRouter } from "../routers/trainingRecords";
import { analyticsRouter } from "../routers/analytics";
import { configRouter } from "../routers/config";
import { copilotRouter } from "../routers/copilot";

export const localAppRouter = localRouter({
  attachments: attachmentsRouter,
  mps: mpsRouter,
  volunteers: volunteersRouter,
  clients: clientsRouter,
  packages: packagesRouter,
  hubGrub: hubGrubRouter,
  mag: magRouter,
  requests: requestsRouter,
  trainingRecords: trainingRecordsRouter,
  analytics: analyticsRouter,
  config: configRouter,
  copilot: copilotRouter,
});
