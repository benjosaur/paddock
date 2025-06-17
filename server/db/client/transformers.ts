import type { ClientReceipt, ClientUpdate } from "./types";
import type { Client } from "../../../shared/types";

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

export function transformClientFromDb(dbClient: ClientReceipt): Client {
  return {
    id: extractIdFromPk(dbClient.pK),
    name: dbClient.details.name,
    dob: dbClient.dateOfBirth,
    address: dbClient.details.address,
    postCode: dbClient.postCode,
    phone: dbClient.details.phone || "",
    email: dbClient.details.email || "",
    nextOfKin: dbClient.details.nextOfKin || "",
    referredBy: dbClient.details.referredBy || "",
    clientAgreementDate: dbClient.details.clientAgreementDate,
    clientAgreementComments: dbClient.details.clientAgreementComments,
    riskAssessmentDate: dbClient.details.riskAssessmentDate,
    riskAssessmentComments: dbClient.details.riskAssessmentComments,
    needs: dbClient.details.needs || [],
    servicesProvided: dbClient.details.services || [],
    hasMp: false,
    hasAttendanceAllowance: false,
  };
}

export function transformClientToDb(client: Partial<Client>): ClientUpdate {
  const update: ClientUpdate = {};

  if (client.id && !isEmptyValue(client.name)) {
    update.pK = `c#${client.id}`;
  }

  if (!isEmptyValue(client.dob)) {
    update.dateOfBirth = client.dob;
  }

  if (!isEmptyValue(client.postCode)) {
    update.postCode = client.postCode;
  }

  const details: any = {};
  let hasDetails = false;

  if (!isEmptyValue(client.name)) {
    details.name = client.name;
    hasDetails = true;
  }

  if (!isEmptyValue(client.address)) {
    details.address = client.address;
    hasDetails = true;
  }

  if (!isEmptyValue(client.phone)) {
    details.phone = client.phone;
    hasDetails = true;
  }

  if (!isEmptyValue(client.email)) {
    details.email = client.email;
    hasDetails = true;
  }

  if (!isEmptyValue(client.nextOfKin)) {
    details.nextOfKin = client.nextOfKin;
    hasDetails = true;
  }

  if (!isEmptyValue(client.referredBy)) {
    details.referredBy = client.referredBy;
    hasDetails = true;
  }

  if (!isEmptyValue(client.clientAgreementDate)) {
    details.clientAgreementDate = client.clientAgreementDate;
    hasDetails = true;
  }

  if (!isEmptyValue(client.clientAgreementComments)) {
    details.clientAgreementComments = client.clientAgreementComments;
    hasDetails = true;
  }

  if (!isEmptyValue(client.riskAssessmentDate)) {
    details.riskAssessmentDate = client.riskAssessmentDate;
    hasDetails = true;
  }

  if (!isEmptyValue(client.riskAssessmentComments)) {
    details.riskAssessmentComments = client.riskAssessmentComments;
    hasDetails = true;
  }

  if (!isEmptyValue(client.needs)) {
    details.needs = client.needs;
    hasDetails = true;
  }

  if (!isEmptyValue(client.servicesProvided)) {
    details.services = client.servicesProvided;
    hasDetails = true;
  }

  if (hasDetails) {
    details.updatedAt = new Date().toISOString();
    details.updatedBy = new Date().toISOString();
    update.details = details;
  }

  return update;
}
