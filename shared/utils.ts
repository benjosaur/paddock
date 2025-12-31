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

export const getEarliestDate = (
  dates: (string | undefined)[]
): string | undefined => {
  // dates can be yyyy-mm-dd or open

  return dates.sort().at(0); // asc by default and numbers come before letters by default
};

export const getLatestDate = (dates: string[]): string | undefined => {
  // dates can be yyyy-mm-dd or open

  return dates.sort().at(-1); // asc by default and numbers come before letters by default
};
