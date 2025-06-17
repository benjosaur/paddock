import type { VLogMeta, VLogClient, VLogVolunteer } from "./types";
import type { VolunteerLog } from "../../../shared/types";

function extractIdFromPk(pk: string): number {
  const parts = pk.split("#");
  return parseInt(parts[parts.length - 1]);
}

function isEmptyValue(value: unknown): boolean {
  return (
    value === "" ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function transformVolunteerLogFromDb(
  logMeta: VLogMeta,
  logClient: VLogClient,
  logVolunteer: VLogVolunteer
): VolunteerLog {
  return {
    id: extractIdFromPk(logMeta.pK),
    date: logMeta.date,
    clientId: extractIdFromPk(logClient.pK),
    volunteerId: extractIdFromPk(logVolunteer.pK),
    activity: logMeta.details.activity || "",
    hoursLogged: parseFloat(logMeta.details.hoursLogged),
    notes: logMeta.details.notes || "",
  };
}

export function transformVolunteerLogToDb(
  volunteerLog: Partial<VolunteerLog>
): {
  logMeta: Partial<VLogMeta>;
  logClient: Partial<VLogClient>;
  logVolunteer: Partial<VLogVolunteer>;
} {
  const logMeta: Partial<VLogMeta> = {};
  const logClient: Partial<VLogClient> = {};
  const logVolunteer: Partial<VLogVolunteer> = {};

  if (volunteerLog.id) {
    logMeta.pK = `vlog#${volunteerLog.id}`;
    logClient.pK = `vlog#${volunteerLog.id}`;
    logVolunteer.pK = `vlog#${volunteerLog.id}`;
  }

  if (!isEmptyValue(volunteerLog.date)) {
    logMeta.date = volunteerLog.date;
  }

  const metaDetails: any = {};
  let hasMetaDetails = false;

  if (volunteerLog.hoursLogged !== undefined) {
    metaDetails.hoursLogged = volunteerLog.hoursLogged.toString();
    hasMetaDetails = true;
  }

  if (!isEmptyValue(volunteerLog.notes)) {
    metaDetails.notes = volunteerLog.notes;
    hasMetaDetails = true;
  }

  if (!isEmptyValue(volunteerLog.activity)) {
    metaDetails.activity = volunteerLog.activity;
    hasMetaDetails = true;
  }

  if (hasMetaDetails) {
    logMeta.details = metaDetails;
  }

  return { logMeta, logClient, logVolunteer };
}
