const seededDataModel = {
  ModelName: "WiveyCares",
  ModelMetadata: {
    Author: "",
    DateCreated: "Jun 14, 2025, 02:29 PM",
    DateLastModified: "Jun 19, 2025, 07:26 PM",
    Description: "",
    AWSService: "Amazon DynamoDB",
    Version: "3.0",
  },
  DataModel: [
    {
      TableName: "WiveyCares",
      KeyAttributes: {
        PartitionKey: {
          AttributeName: "pK",
          AttributeType: "S",
        },
        SortKey: {
          AttributeName: "sK",
          AttributeType: "S",
        },
      },
      NonKeyAttributes: [
        {
          AttributeName: "entityType",
          AttributeType: "S",
        },
        {
          AttributeName: "dateOfBirth",
          AttributeType: "S",
        },
        {
          AttributeName: "postCode",
          AttributeType: "S",
        },
        {
          AttributeName: "date",
          AttributeType: "S",
        },
        {
          AttributeName: "recordName",
          AttributeType: "S",
        },
        {
          AttributeName: "recordExpiry",
          AttributeType: "S",
        },
        {
          AttributeName: "details",
          AttributeType: "M",
        },
        {
          AttributeName: "createdAt",
          AttributeType: "S",
        },
        {
          AttributeName: "updatedAt",
          AttributeType: "S",
        },
        {
          AttributeName: "updatedBy",
          AttributeType: "S",
        },
        {
          AttributeName: "entityOwner",
          AttributeType: "S",
        },
      ],
      TableFacets: [],
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeyAttributes: {
            PartitionKey: {
              AttributeName: "entityOwner",
              AttributeType: "S",
            },
            SortKey: {
              AttributeName: "entityType",
              AttributeType: "S",
            },
          },
          Projection: {
            ProjectionType: "ALL",
          },
        },
        {
          IndexName: "GSI2",
          KeyAttributes: {
            PartitionKey: {
              AttributeName: "sK",
              AttributeType: "S",
            },
            SortKey: {
              AttributeName: "pK",
              AttributeType: "S",
            },
          },
          Projection: {
            ProjectionType: "ALL",
          },
        },
        {
          IndexName: "GSI3",
          KeyAttributes: {
            PartitionKey: {
              AttributeName: "entityType",
              AttributeType: "S",
            },
            SortKey: {
              AttributeName: "recordExpiry",
              AttributeType: "S",
            },
          },
          Projection: {
            ProjectionType: "ALL",
          },
        },
        {
          IndexName: "GSI4",
          KeyAttributes: {
            PartitionKey: {
              AttributeName: "entityType",
              AttributeType: "S",
            },
            SortKey: {
              AttributeName: "date",
              AttributeType: "S",
            },
          },
          Projection: {
            ProjectionType: "ALL",
          },
        },
        {
          IndexName: "GSI5",
          KeyAttributes: {
            PartitionKey: {
              AttributeName: "entityType",
              AttributeType: "S",
            },
            SortKey: {
              AttributeName: "postCode",
              AttributeType: "S",
            },
          },
          Projection: {
            ProjectionType: "ALL",
          },
        },
      ],
      TableData: [
        {
          pK: {
            S: "c#1",
          },
          sK: {
            S: "c#1",
          },
          entityType: {
            S: "client",
          },
          dateOfBirth: {
            S: "2024-10-15T06:04:12.543Z",
          },
          postCode: {
            S: "TA1 3PT",
          },
          details: {
            M: {
              name: {
                S: "Miss Sadie Batz",
              },
              address: {
                S: "61626 Schmidt Divide",
              },
              phone: {
                S: "+447449334336",
              },
              email: {
                S: "hello@hello.com",
              },
              nextOfKin: {
                S: "Neal Lehner",
              },
              referredBy: {
                S: "Kari Thiel",
              },
              clientAgreementDate: {
                S: "2026-03-08T02:50:13.086Z",
              },
              clientAgreementComments: {
                S: "None",
              },
              riskAssessmentDate: {
                S: "2026-03-08T02:50:13.086Z",
              },
              riskAssessmentComments: {
                S: "None",
              },
              needs: {
                L: [
                  {
                    S: "Cookies",
                  },
                  {
                    S: "Befriending",
                  },
                ],
              },
              services: {
                L: [
                  {
                    S: "Personal Care",
                  },
                  {
                    S: "Washing",
                  },
                ],
              },
              attendanceAllowance: {
                S: "Pending",
              },
              attendsMag: {
                BOOL: false,
              },
              notes: {
                S: "None",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "client",
          },
        },
        {
          pK: {
            S: "mp#1",
          },
          sK: {
            S: "mp#1",
          },
          entityType: {
            S: "mp",
          },
          dateOfBirth: {
            S: "2025-02-14T22:27:33.362Z",
          },
          postCode: {
            S: "TA2 3PT",
          },
          recordName: {
            S: "DBS#321321",
          },
          recordExpiry: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              name: {
                S: "Richard Schamberger",
              },
              address: {
                S: "76648 Sawayn Stravenue",
              },
              phone: {
                S: "+447449334336",
              },
              email: {
                S: "hello@hello.com",
              },
              nextOfKin: {
                S: "Neal Lehner",
              },
              needs: {
                L: [
                  {
                    S: "Cookies",
                  },
                  {
                    S: "Befriending",
                  },
                ],
              },
              services: {
                L: [
                  {
                    S: "Personal Care",
                  },
                  {
                    S: "Washing",
                  },
                ],
              },
              specialisms: {
                L: [
                  {
                    S: "Personal Care",
                  },
                  {
                    S: "Washing",
                  },
                ],
              },
              transport: {
                BOOL: true,
              },
              capacity: {
                S: "1hr/week",
              },
              notes: {
                S: "None",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "mp",
          },
        },
        {
          pK: {
            S: "v#1",
          },
          sK: {
            S: "v#1",
          },
          entityType: {
            S: "volunteer",
          },
          dateOfBirth: {
            S: "2025-09-02T04:12:31.916Z",
          },
          postCode: {
            S: "TA2 3PT",
          },
          details: {
            M: {
              name: {
                S: "Marilyn Prohaska",
              },
              address: {
                S: "7159 Nelson Street",
              },
              phone: {
                S: "+447449334336",
              },
              email: {
                S: "hello@hello.com",
              },
              nextOfKin: {
                S: "Neal Lehner",
              },
              needs: {
                L: [
                  {
                    S: "Cookies",
                  },
                  {
                    S: "Befriending",
                  },
                ],
              },
              dbsNumber: {
                N: "321321",
              },
              services: {
                L: [
                  {
                    S: "Personal Care",
                  },
                  {
                    S: "Washing",
                  },
                ],
              },
              specialisms: {
                L: [
                  {
                    S: "Personal Care",
                  },
                  {
                    S: "Washing",
                  },
                ],
              },
              transport: {
                BOOL: true,
              },
              capacity: {
                S: "1hr/week",
              },
              notes: {
                S: "None",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "volunteer",
          },
        },
        {
          pK: {
            S: "mp#1",
          },
          sK: {
            S: "tr#1",
          },
          entityType: {
            S: "trainingRecord",
          },
          recordName: {
            S: "Health&Safety",
          },
          recordExpiry: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              name: {
                S: "Richard Schamberger",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "mp",
          },
        },
        {
          pK: {
            S: "mag#1",
          },
          sK: {
            S: "mag#1",
          },
          entityType: {
            S: "magLog",
          },
          date: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              totalAttendees: {
                N: "10",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "main",
          },
        },
        {
          pK: {
            S: "c#1",
          },
          sK: {
            S: "mag#1",
          },
          entityType: {
            S: "magLog",
          },
          date: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              name: {
                S: "Miss Sadie Batz",
              },
              notes: {
                S: "None",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "client",
          },
        },
        {
          pK: {
            S: "mplog#1",
          },
          sK: {
            S: "mplog#1",
          },
          entityType: {
            S: "mpLog",
          },
          date: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              hoursLogged: {
                N: "1.5",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "main",
          },
        },
        {
          pK: {
            S: "mp#1",
          },
          sK: {
            S: "mplog#1",
          },
          entityType: {
            S: "mpLog",
          },
          date: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              name: {
                S: "Richard Schamberger",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "mp",
          },
        },
        {
          pK: {
            S: "c#1",
          },
          sK: {
            S: "mplog#1",
          },
          entityType: {
            S: "mpLog",
          },
          postCode: {
            S: "TA1 3PT",
          },
          date: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              name: {
                S: "Miss Sadie Batz",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "client",
          },
        },
        {
          pK: {
            S: "vlog#1",
          },
          sK: {
            S: "vlog#1",
          },
          entityType: {
            S: "volunteerLog",
          },
          date: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              hoursLogged: {
                N: "1.5",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "main",
          },
        },
        {
          pK: {
            S: "v#1",
          },
          sK: {
            S: "vlog#1",
          },
          entityType: {
            S: "volunteerLog",
          },
          date: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              name: {
                S: "Marilyn Prohaska",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "volunteer",
          },
        },
        {
          pK: {
            S: "c#1",
          },
          sK: {
            S: "vlog#1",
          },
          entityType: {
            S: "volunteerLog",
          },
          postCode: {
            S: "TA1 3PT",
          },
          date: {
            S: "2025-12-01T07:20:39.894Z",
          },
          details: {
            M: {
              name: {
                S: "Miss Sadie Batz",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "client",
          },
        },
        {
          pK: {
            S: "c#1",
          },
          sK: {
            S: "c#req#1",
          },
          entityType: {
            S: "mpRequest",
          },
          date: {
            S: "ASAP",
          },
          details: {
            M: {
              name: {
                S: "Miss Sadie Batz",
              },
              notes: {
                S: "None",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "client",
          },
        },
        {
          pK: {
            S: "c#1",
          },
          sK: {
            S: "c#req#2",
          },
          entityType: {
            S: "volunteerRequest",
          },
          date: {
            S: "ASAP",
          },
          details: {
            M: {
              name: {
                S: "Miss Sadie Batz",
              },
              notes: {
                S: "None",
              },
            },
          },
          createdAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedAt: {
            S: "2025-12-01T07:20:39.894Z",
          },
          updatedBy: {
            S: "me",
          },
          entityOwner: {
            S: "client",
          },
        },
      ],
      DataAccess: {
        MySql: {},
      },
      SampleDataFormats: {
        phone: ["identifiers", "Phone"],
        email: ["identifiers", "Email"],
        name: ["identifiers", "Full name"],
        nextOfKin: ["identifiers", "Full name"],
        dbsNumber: ["Int"],
        dbsExpiry: ["date", "ISO 8601 date and time"],
        dateOfBirth: ["date", "ISO 8601 date and time"],
        address: ["identifiers", "Address"],
        entityType: ["dataTypes", "String"],
        referredBy: ["identifiers", "Full name"],
        clientAgreementDate: ["date", "ISO 8601 date and time"],
        riskAssessmentDate: ["date", "ISO 8601 date and time"],
        createdAt: ["date", "ISO 8601 date and time"],
        updatedAt: ["date", "ISO 8601 date and time"],
        trainingExpiry: ["date", "ISO 8601 date and time"],
        hours: ["Float"],
        hoursLogged: ["Float"],
        date: ["date", "ISO 8601 date and time"],
        recordExpiry: ["date", "ISO 8601 date and time"],
      },
      BillingMode: "PAY_PER_REQUEST",
    },
  ],
};
