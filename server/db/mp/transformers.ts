import type { MpReceipt, MpUpdate } from "./types";
import type { TrainingRecord } from "../training/types";
import type { Mp, TrainingRecordItem } from "../../../shared/types";

function isEmptyValue(value: unknown): boolean {
  return (
    value === "" ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function transformMpFromDb(
  dbMp: MpReceipt,
  trainingRecords: TrainingRecord[] = []
): Mp {
  const transformedTrainingRecords: TrainingRecordItem[] = trainingRecords.map(
    (record) => ({
      training: record.recordName,
      expiry: record.recordExpiry,
    })
  );

  return {
    id: dbMp.pK,
    name: dbMp.details.name,
    dob: dbMp.dateOfBirth,
    address: dbMp.details.address,
    postCode: dbMp.postCode,
    phone: dbMp.details.phone || "",
    email: dbMp.details.email || "",
    nextOfKin: dbMp.details.nextOfKin || "",
    dbsNumber: dbMp.recordName,
    dbsExpiry: dbMp.recordExpiry || "",
    servicesOffered: dbMp.details.services || [],
    specialisms: dbMp.details.specialisms || [],
    transport: dbMp.details.transport,
    capacity: dbMp.details.capacity || "",
    trainingRecords: transformedTrainingRecords,
  };
}

export function transformMpToDb(mp: Partial<Mp>): MpUpdate {
  const update: MpUpdate = {};

  if (mp.id && !isEmptyValue(mp.name)) {
    update.pK = `mp#${mp.id}`;
  }

  if (!isEmptyValue(mp.dob)) {
    update.dateOfBirth = mp.dob;
  }

  if (!isEmptyValue(mp.postCode)) {
    update.postCode = mp.postCode;
  }

  if (!isEmptyValue(mp.dbsNumber)) {
    update.recordName = mp.dbsNumber;
  }

  if (!isEmptyValue(mp.dbsExpiry)) {
    update.recordExpiry = mp.dbsExpiry;
  }

  const details: any = {};
  let hasDetails = false;

  if (!isEmptyValue(mp.name)) {
    details.name = mp.name;
    hasDetails = true;
  }

  if (!isEmptyValue(mp.address)) {
    details.address = mp.address;
    hasDetails = true;
  }

  if (!isEmptyValue(mp.phone)) {
    details.phone = mp.phone;
    hasDetails = true;
  }

  if (!isEmptyValue(mp.email)) {
    details.email = mp.email;
    hasDetails = true;
  }

  if (!isEmptyValue(mp.nextOfKin)) {
    details.nextOfKin = mp.nextOfKin;
    hasDetails = true;
  }

  if (!isEmptyValue(mp.servicesOffered)) {
    details.services = mp.servicesOffered;
    hasDetails = true;
  }

  if (!isEmptyValue(mp.specialisms)) {
    details.specialisms = mp.specialisms;
    hasDetails = true;
  }

  if (mp.transport !== undefined) {
    details.transport = mp.transport;
    hasDetails = true;
  }

  if (!isEmptyValue(mp.capacity)) {
    details.capacity = mp.capacity;
    hasDetails = true;
  }

  if (hasDetails) {
    details.updatedAt = new Date().toISOString();
    details.updatedBy = new Date().toISOString();
    update.details = details;
  }

  return update;
}
