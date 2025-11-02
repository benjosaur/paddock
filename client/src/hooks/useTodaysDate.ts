import { useEffect } from "react";

export function formatLocalDateYYYYMMDD(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Ensures startDate is set to today's local date (YYYY-MM-DD) for new entities.
 * Call this in forms that maintain startDate in state.
 */
export function useTodaysDate(options: {
  enabled: boolean;
  setDate: (value: string) => void;
}) {
  const { enabled, setDate } = options;

  useEffect(() => {
    if (enabled) {
      setDate(formatLocalDateYYYYMMDD(new Date()));
    }
  }, [enabled, setDate]);
}
