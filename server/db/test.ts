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

export const sampleUser: User = {
  role: "Admin",
  sub: "test-user-123",
};

const clientService = new ClientService();
const mpService = new MpService();
const volunteerService = new VolunteerService();
const packageService = new PackageService();
const magLogService = new MagLogService();
const trainingRecordService = new TrainingRecordService();
const requestService = new RequestService();

async function runAllTests() {
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

runAllTests();

// Manual Reads

console.dir(await clientService.getAll(sampleUser), { depth: null });
console.dir(await clientService.getAllNotArchived(sampleUser), { depth: null });
console.dir(await clientService.getById("c#1", sampleUser), { depth: null });
console.dir(await mpService.getAll(sampleUser), { depth: null });
console.dir(await mpService.getAllNotArchived(sampleUser), { depth: null });
console.dir(await mpService.getById("mp#1", sampleUser), { depth: null });
console.dir(await volunteerService.getAll(sampleUser), { depth: null });
console.dir(await volunteerService.getAllNotArchived(sampleUser), {
  depth: null,
});
console.dir(await volunteerService.getById("v#1", sampleUser), { depth: null });
console.dir(await packageService.getAll(sampleUser), { depth: null });
console.dir(await packageService.getAllNotArchived(sampleUser), {
  depth: null,
});
console.dir(await packageService.getById("pkg#1", sampleUser), { depth: null });
console.dir(await magLogService.getAll(sampleUser), { depth: null });
console.dir(await magLogService.getById("mag#1", sampleUser), { depth: null });
console.dir(await trainingRecordService.getAll(sampleUser), { depth: null });
console.dir(await requestService.getAllMetadata(sampleUser), { depth: null });
console.dir(await requestService.getAllNotArchivedWithPackages(sampleUser), {
  depth: null,
});
console.dir(await requestService.getById("req#1", sampleUser), { depth: null });
