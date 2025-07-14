import { ClientService } from "./client/service";
import { MpService } from "./mp/service";
import { MpLogService } from "./package/service";
import { VolunteerService } from "./volunteer/service";
import { VolunteerLogService } from "./vlog/service";
import { MagLogService } from "./mag/service";
import { TrainingRecordService } from "./training/service";
import { testClientService } from "./client/test";
import { testMpService } from "./mp/test";
import { testMpLogService } from "./package/test";
import { testVolunteerService } from "./volunteer/test";
import { testVolunteerLogService } from "./vlog/test";
import { testMagLogService } from "./mag/test";
import { testTrainingRecordService } from "./training/test";
import { testRequestService } from "./requests/test";

export const sampleUser: User = {
  role: "Test",
  sub: "test-user-123",
};

const clientService = new ClientService();
const mpService = new MpService();
const volunteerService = new VolunteerService();
const mpLogService = new MpLogService();
const volunteerLogService = new VolunteerLogService();
const magLogService = new MagLogService();
const trainingRecordService = new TrainingRecordService();

async function runAllTests() {
  console.log("🚀 Starting all database tests...\n");

  try {
    await testClientService();
    await testMpService();
    await testMpLogService();
    await testVolunteerService();
    await testVolunteerLogService();
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
console.dir(await clientService.getById(sampleUser, "c#1"), { depth: null });
console.dir(await mpService.getAll(sampleUser), { depth: null });
console.dir(await mpService.getById(sampleUser, "mp#1"), { depth: null });
console.dir(await volunteerService.getAll(sampleUser), { depth: null });
console.dir(await volunteerService.getById(sampleUser, "v#1"), { depth: null });
console.dir(await mpLogService.getAll(sampleUser), { depth: null });
console.dir(await mpLogService.getById(sampleUser, "mplog#1"), { depth: null });
console.dir(await mpLogService.getBySubstring(sampleUser, "ey"), {
  depth: null,
});
console.dir(await mpLogService.getByMpId(sampleUser, "mp#1"), { depth: null });
console.dir(await mpLogService.getByMpId(sampleUser, "mp#1"), { depth: null });
console.dir(
  await mpLogService.getByDateInterval(sampleUser, {
    startDate: "2024-01-01",
    endDate: "2026-01-31",
  }),
  { depth: null }
);
console.dir(await volunteerLogService.getAll(sampleUser), { depth: null });
console.dir(await volunteerLogService.getById(sampleUser, "vlog#1"), {
  depth: null,
});
console.dir(await volunteerLogService.getBySubstring(sampleUser, "ey"), {
  depth: null,
});
console.dir(await volunteerLogService.getByVolunteerId(sampleUser, "v#1"), {
  depth: null,
});
console.dir(
  await volunteerLogService.getByDateInterval(sampleUser, {
    startDate: "2024-01-01",
    endDate: "2026-01-31",
  }),
  { depth: null }
);
console.dir(await magLogService.getAll(sampleUser), { depth: null });
console.dir(await magLogService.getById(sampleUser, "mag#1"), { depth: null });
console.dir(
  await magLogService.getByDateInterval(sampleUser, {
    startDate: "2024-01-01",
    endDate: "2026-01-31",
  }),
  { depth: null }
);
console.dir(await trainingRecordService.getAll(sampleUser), { depth: null });
console.dir(
  await trainingRecordService.getByExpiringBefore(sampleUser, "2026-01-31"),
  { depth: null }
);
