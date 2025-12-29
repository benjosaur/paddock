export const isIdClient = (id: string): boolean => {
  return id.startsWith("c#");
};
export const isIdMp = (id: string): boolean => {
  return id.startsWith("mp#");
};
export const isIdVolunteer = (id: string): boolean => {
  return id.startsWith("v#");
};
export const isIdRequest = (id: string): boolean => {
  return id.startsWith("req#");
};
export const isIdPackage = (id: string): boolean => {
  return id.startsWith("pkg#");
};
export const isIdTrainingRecord = (id: string): boolean => {
  return id.startsWith("tr#");
};
export const isIdMagLog = (id: string): boolean => {
  return id.startsWith("mag#");
};
