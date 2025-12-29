// Converts a date string from YYYY-MM-DD to DD-MM-YYYY. Leaves other inputs unchanged.
export function formatYmdToDmy(value?: string | null): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}

export const getEarliestEndDate = (dates: string[]) => {
  // dates can be yyyy-mm-dd or open

  if (dates.length === 0)
    throw new Error("Can't find earliest date for date array of length 0");

  // Return the earliest date
  return dates.sort()[0]; // asc by default and numbers come before letters by default
};
