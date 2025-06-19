import type { MagLog as DbMagLog, MagClientLog } from "./types";
import type { MagLog } from "../../../shared/types";

function isEmptyValue(value: unknown): boolean {
  return (
    value === "" ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function transformMagLogFromDb(
  dbMagLog: DbMagLog,
  clientLogs: MagClientLog[] = []
): MagLog {
  const attendeeIds = clientLogs.map((log) => log.pK);

  return {
    id: dbMagLog.pK,
    date: dbMagLog.date,
    total: parseFloat(dbMagLog.details.totalAttendees || "0"),
    attendees: attendeeIds,
    notes: "",
  };
}

export function transformMagLogToDb(magLog: Partial<MagLog>): {
  magLog: Partial<DbMagLog>;
  clientLogs: Partial<MagClientLog>[];
} {
  const dbMagLog: Partial<DbMagLog> = {};
  const clientLogs: Partial<MagClientLog>[] = [];

  if (magLog.id) {
    dbMagLog.pK = `mag#${magLog.id}`;
  }

  if (!isEmptyValue(magLog.date)) {
    dbMagLog.date = magLog.date;
  }

  const details: any = {};
  let hasDetails = false;

  if (magLog.total !== undefined) {
    details.totalAttendees = magLog.total.toString();
    hasDetails = true;
  }

  if (hasDetails) {
    dbMagLog.details = details;
  }

  if (!isEmptyValue(magLog.attendees) && magLog.id) {
    magLog.attendees?.forEach((attendeeId, index) => {
      clientLogs.push({
        pK: `mag#${magLog.id}`,
        sK: `client#${attendeeId}`,
        entityType: "magClientLog",
        details: {
          name: "",
        },
      });
    });
  }

  return { magLog: dbMagLog, clientLogs };
}
