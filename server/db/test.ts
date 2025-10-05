import { ClientService } from "./client/service";
import { MpService } from "./mp/service";
import { PackageService } from "./package/service";
import { VolunteerService } from "./volunteer/service";
import { MagLogService } from "./mag/service";
import { TrainingRecordService } from "./training/service";
import { RequestService } from "./requests/service";
import { testClientService } from "./client/test";
import { testMpService } from "./mp/test";
import { testPackageService } from "./package/test";
import { testVolunteerService } from "./volunteer/test";
import { testMagLogService } from "./mag/test";
import { testTrainingRecordService } from "./training/test";
import { testRequestService } from "./requests/test";
import { sampleUser } from "../utils/test";

const clientService = new ClientService();
const mpService = new MpService();
const volunteerService = new VolunteerService();
const packageService = new PackageService();
const magLogService = new MagLogService();
const trainingRecordService = new TrainingRecordService();
const requestService = new RequestService();

export async function runAll() {
  console.log("🚀 Starting all database tests...\n");

  try {
    await testClientService();
    await testMpService();
    await testPackageService();
    await testVolunteerService();
    await testMagLogService();
    await testTrainingRecordService();
    await testRequestService();

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  await runAll();
}
