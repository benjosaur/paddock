// import { testClientService } from "./client/test";
// import { testMpService } from "./mp/test";
// import { testPackageService } from "./package/test";
// import { testVolunteerService } from "./volunteer/test";
// import { testMagLogService } from "./mag/test";
// import { testTrainingRecordService } from "./training/test";
// import { testRequestService } from "./requests/test";

// export async function runAll() {
//   console.log("🚀 Starting all database tests...\n");

//   try {
//     await testClientService();
//     await testMpService();
//     await testPackageService();
//     await testVolunteerService();
//     await testMagLogService();
//     await testTrainingRecordService();
//     await testRequestService();

//     console.log("\n✅ All tests completed successfully!");
//   } catch (error) {
//     console.error("\n❌ Test suite failed:", error);
//     process.exit(1);
//   }
// }

// if (import.meta.main) {
//   await runAll();
// }
