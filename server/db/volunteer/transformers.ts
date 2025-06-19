import type { VolunteerReceipt, VolunteerUpdate } from "./types";
import type { TrainingRecord } from "../training/types";
import type { Volunteer, TrainingRecordItem } from "../../../shared/types";

function isEmptyValue(value: unknown): boolean {
  return (
    value === "" ||
    value === null ||
    value === undefined ||
    (Array.isArray(value) && value.length === 0)
  );
}

export function transformVolunteerFromDb(
  dbVolunteer: VolunteerReceipt,
  trainingRecords: TrainingRecord[] = []
): Volunteer {
  const transformedTrainingRecords: TrainingRecordItem[] = trainingRecords.map(
    (record) => ({
      training: record.recordName,
      expiry: record.recordExpiry,
    })
  );

  return {
    id: dbVolunteer.pK,
    name: dbVolunteer.details.name,
    dob: dbVolunteer.dateOfBirth,
    address: dbVolunteer.details.address,
    postCode: dbVolunteer.postCode,
    phone: dbVolunteer.details.phone || "",
    email: dbVolunteer.details.email || "",
    nextOfKin: dbVolunteer.details.nextOfKin || "",
    dbsNumber: dbVolunteer.details.dbsNumber,
    dbsExpiry: dbVolunteer.details.dbsExpiry,
    servicesOffered: dbVolunteer.details.services || [],
    needTypes: dbVolunteer.details.needs || [],
    transport: dbVolunteer.details.transport,
    capacity: dbVolunteer.details.capacity || "",
    specialisms: dbVolunteer.details.specialisms,
    trainingRecords: transformedTrainingRecords,
  };
}

export function transformVolunteerToDb(
  volunteer: Partial<Volunteer>
): VolunteerUpdate {
  const update: VolunteerUpdate = {};

  if (volunteer.id && !isEmptyValue(volunteer.name)) {
    update.pK = `v#${volunteer.id}`;
  }

  if (!isEmptyValue(volunteer.dob)) {
    update.dateOfBirth = volunteer.dob;
  }

  if (!isEmptyValue(volunteer.postCode)) {
    update.postCode = volunteer.postCode;
  }

  const details: any = {};
  let hasDetails = false;

  if (!isEmptyValue(volunteer.name)) {
    details.name = volunteer.name;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.address)) {
    details.address = volunteer.address;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.phone)) {
    details.phone = volunteer.phone;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.email)) {
    details.email = volunteer.email;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.nextOfKin)) {
    details.nextOfKin = volunteer.nextOfKin;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.dbsNumber)) {
    details.dbsNumber = volunteer.dbsNumber;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.dbsExpiry)) {
    details.dbsExpiry = volunteer.dbsExpiry;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.servicesOffered)) {
    details.services = volunteer.servicesOffered;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.needTypes)) {
    details.needs = volunteer.needTypes;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.specialisms)) {
    details.specialisms = volunteer.specialisms;
    hasDetails = true;
  }

  if (volunteer.transport !== undefined) {
    details.transport = volunteer.transport;
    hasDetails = true;
  }

  if (!isEmptyValue(volunteer.capacity)) {
    details.capacity = volunteer.capacity;
    hasDetails = true;
  }

  if (hasDetails) {
    details.updatedAt = new Date().toISOString();
    details.updatedBy = new Date().toISOString();
    update.details = details;
  }

  return update;
}
