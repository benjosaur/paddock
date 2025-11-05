export const firstYear = 2017;
export const userRoles = [
  "Admin",
  "Trustee",
  "Coordinator",
  "Finance",
  "Test",
] as const;
export const volunteerRoles = [
  "Coordinator",
  "Volunteer",
  "Trustee",
  "Finance",
] as const;
export const requestTypes = ["paid", "unpaid"] as const;
export const requestStatus = ["normal", "urgent"] as const;
export const attendanceAllowanceLevels = ["None", "Low", "High"] as const;
export const attendanceAllowanceStatuses = [
  "None",
  "Unsent",
  "Pending",
  "Low",
  "High",
] as const;
export const booleanTypes = ["Y", "N"] as const;
export const notesSource = ["Phone", "Email", "In Person"] as const;
export const serviceOptions = [
  "Personal Care/Domestic",
  "Attendance Allowance",
  "Blue Badge",
  "Companionship",
  "Sitting Service",
  "Overnight",
  "Meal Prep",
  "Med Prompt",
  "Transport",
  "Information",
  "MAG",
  "Other",
] as const;
export type ServiceOption = (typeof serviceOptions)[number];
export const soleServiceOptions = [
  "MAG",
  "Hub and Grub",
  "Trustee",
  "Finance",
  "Technical",
] as const;
export const coreTrainingRecordTypes = [
  "First Aid Skills",
  "Professional Boundaries",
  "Moving and Handling People",
  "Handling Information GWPR and DPR",
  "Adult Safeguarding",
] as const;
export const trainingRecordTypes = [
  ...coreTrainingRecordTypes,
  "Basic Life Support",
  "Other",
] as const;
export const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const wordMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
export const localities = [
  "Wiveliscombe",
  "Ashbrittle",
  "Bathealton",
  "Brompton Ralph",
  "Chipstable",
  "Waterrow",
  "Clatworthy",
  "Huish Champflower",
  "Milverton",
  "Stawley",
  "Other",
  "Unknown",
] as const;
export const DEPRIVATION_THRESHOLD_DECILE = 3;
