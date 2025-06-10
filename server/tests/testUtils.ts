import { appRouter } from "../trpc/router.ts";
import { Request, Response } from "express";
import { createCallerFactory } from "../trpc/trpc.ts";
import { db } from "../db/index.ts";

const mockRequest = {} as Request;
const mockResponse = {} as Response;

export const createTestCaller = async () => {
  const caller = createCallerFactory(appRouter);
  const ctx = { req: mockRequest, res: mockResponse, db };
  return caller(ctx);
};

export const testData = {
  mp: {
    name: "Test MP",
    address: "123 Test St",
    postCode: "T12 3ST",
    phone: "01234567890",
    email: "testmp@example.com",
    nextOfKin: "Test Next of Kin",
    dbsNumber: "12345678",
    dbsExpiry: "2025-12-31",
    servicesOffered: ["Companion", "Transport"],
    specialisms: ["Elderly Care"],
    transport: true,
    capacity: "Available",
    trainingRecords: [
      {
        training: "First Aid",
        expiry: "2025-06-01",
      },
    ],
  },
  volunteer: {
    name: "Test Volunteer",
    address: "456 Test Ave",
    postCode: "T45 6TE",
    phone: "01234567891",
    email: "volunteer@example.com",
    nextOfKin: "Volunteer Next of Kin",
    dbsNumber: "87654321",
    dbsExpiry: "2025-11-30",
    servicesOffered: ["Companion", "Shopping"],
    needTypes: ["Social", "Practical"],
    transport: true,
    capacity: "Available",
    specialisms: ["Mental Health"],
    trainingRecords: [
      {
        training: "Safeguarding",
        expiry: "2025-08-01",
      },
    ],
  },
  client: {
    name: "Test Client",
    dob: "1950-01-01",
    address: "789 Test Rd",
    postCode: "T78 9CL",
    phone: "01234567892",
    email: "client@example.com",
    nextOfKin: "Client Next of Kin",
    referredBy: "GP",
    clientAgreementDate: "2024-01-01",
    clientAgreementComments: "Agreed to all terms",
    riskAssessmentDate: "2024-01-01",
    riskAssessmentComments: "Low risk",
    needs: ["Companion", "Transport"],
    servicesProvided: ["Companion"],
    hasMp: true,
    hasAttendanceAllowance: false,
  },
  mpLog: {
    date: "2025-01-01",
    services: ["Companion", "Shopping"],
    hoursLogged: 2.5,
    notes: "Client was very happy with the service",
  },
  volunteerLog: {
    date: "2025-01-01",
    activity: "Companion visit",
    hoursLogged: 2.0,
    notes: "Great conversation about gardening",
  },
  magLog: {
    date: "2025-01-01",
    total: 15,
    notes: "Good attendance today",
  },
  clientRequest: {
    requestType: "paid" as const,
    startDate: "2025-01-15",
    schedule: "Weekly on Tuesdays",
    status: "pending" as const,
  },
};
