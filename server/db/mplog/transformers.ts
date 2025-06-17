import type { MpLogMeta, MpLogClient, MpLogMp } from "./types";
import type { MpLog } from "../../../shared/types";

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

export function transformMpLogFromDb(
  logMeta: MpLogMeta,
  logClient: MpLogClient,
  logMp: MpLogMp
): MpLog {
  return {
    id: extractIdFromPk(logMeta.pK),
    date: logMeta.date,
    clientId: extractIdFromPk(logClient.pK),
    mpId: extractIdFromPk(logMp.pK),
    services: logMeta.details.services || [],
    hoursLogged: parseFloat(logMeta.details.hoursLogged),
    notes: logMeta.details.notes || "",
  };
}

export function transformMpLogToDb(mpLog: Partial<MpLog>): {
  logMeta: Partial<MpLogMeta>;
  logClient: Partial<MpLogClient>;
  logMp: Partial<MpLogMp>;
} {
  const logMeta: Partial<MpLogMeta> = {};
  const logClient: Partial<MpLogClient> = {};
  const logMp: Partial<MpLogMp> = {};

  if (mpLog.id) {
    logMeta.pK = `mplog#${mpLog.id}`;
    logClient.pK = `mplog#${mpLog.id}`;
    logMp.pK = `mplog#${mpLog.id}`;
  }

  if (!isEmptyValue(mpLog.date)) {
    logMeta.date = mpLog.date;
  }

  const metaDetails: any = {};
  let hasMetaDetails = false;

  if (mpLog.hoursLogged !== undefined) {
    metaDetails.hoursLogged = mpLog.hoursLogged.toString();
    hasMetaDetails = true;
  }

  if (!isEmptyValue(mpLog.notes)) {
    metaDetails.notes = mpLog.notes;
    hasMetaDetails = true;
  }

  if (!isEmptyValue(mpLog.services)) {
    metaDetails.services = mpLog.services;
    hasMetaDetails = true;
  }

  if (hasMetaDetails) {
    logMeta.details = metaDetails;
  }

  return { logMeta, logClient, logMp };
}
