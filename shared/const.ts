export const firstYear = 2017;
export const userRoles = [
  "Admin",
  "Trustee",
  "Coordinator",
  "Finance",
  "Test",
] as const;
export const volunteerRoles = ["Coordinator", "Volunteer", "Trustee"] as const;
export const requestTypes = ["paid", "unpaid"] as const;
export const requestStatus = ["pending", "urgent"] as const;
export const attendanceAllowanceStatus = [
  "no",
  "pending",
  "Low",
  "High",
] as const;
export const booleanTypes = ["Y", "N"] as const;
export const notesSource = ["Phone", "Email", "In Person"] as const;
export const serviceOptions = [
  "Personal Care",
  "Domestic",
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
export const trainingRecordTypes = [
  "First Aid",
  "Professional Boundaries",
  "Manual Handling",
  "GDPR",
  "Safeguarding",
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
] as const;
export const DEPRIVATION_THRESHOLD_DECILE = 3;
