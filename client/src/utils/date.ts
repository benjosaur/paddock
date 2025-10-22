// Converts a date string from YYYY-MM-DD to DD-MM-YYYY. Leaves other inputs unchanged.
export function formatYmdToDmy(value?: string | null): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
}
