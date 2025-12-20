# Quickstart

In order to locally run the project, we need to run the backend with:

```bash
cd server
bun run dev
```

and run the frontend with

```bash
cd client
bun run dev
```

The backend requires some configuration to work correctly. First setup environment variables:

- Add the `.env` file in `/server`, you can copy from `.env.example`
- In the `.env` you need to provide `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` from Ben.
  Then we need to set up our local instance of dynamodb. Download this ffrom the internet and run inn terminal with

```bash
cd EXTRACTED_DYNAMODB_FOLDER
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

or maybe with (this doesn't seem to work for me)

```bash
brew install dynamodb-local
dynamodb-local -sharedDb
```

- Setup NoSQL workbench
- We need to make the table model
  Go into
- Data Modeller
- Make table `WiveyCares2`
- JSON view of data model -> text:

```json
{
  "ModelName": "WiveyCares2",
  "ModelMetadata": {
    "Author": "",
    "DateCreated": "Dec 15, 2025, 04:42 PM",
    "DateLastModified": "Dec 18, 2025, 09:22 PM",
    "Description": "",
    "AWSService": "Amazon DynamoDB",
    "Version": "3.0"
  },
  "DataModel": [
    {
      "TableName": "WiveyCares2",
      "KeyAttributes": {
        "PartitionKey": {
          "AttributeName": "pK",
          "AttributeType": "S"
        },
        "SortKey": {
          "AttributeName": "sK",
          "AttributeType": "S"
        }
      },
      "NonKeyAttributes": [
        {
          "AttributeName": "entityType",
          "AttributeType": "S"
        },
        {
          "AttributeName": "endDate",
          "AttributeType": "S"
        },
        {
          "AttributeName": "details",
          "AttributeType": "M"
        },
        {
          "AttributeName": "dateOfBirth",
          "AttributeType": "S"
        },
        {
          "AttributeName": "requestId",
          "AttributeType": "S"
        },
        {
          "AttributeName": "requestType",
          "AttributeType": "S"
        },
        {
          "AttributeName": "startDate",
          "AttributeType": "S"
        },
        {
          "AttributeName": "updatedAt",
          "AttributeType": "S"
        },
        {
          "AttributeName": "updatedBy",
          "AttributeType": "S"
        },
        {
          "AttributeName": "date",
          "AttributeType": "S"
        },
        {
          "AttributeName": "expiryDate",
          "AttributeType": "S"
        }
      ],
      "TableFacets": [],
      "GlobalSecondaryIndexes": [
        {
          "IndexName": "GSI1",
          "KeyAttributes": {
            "PartitionKey": {
              "AttributeName": "requestId",
              "AttributeType": "S"
            },
            "SortKey": {
              "AttributeName": "sK",
              "AttributeType": "S"
            }
          },
          "Projection": {
            "ProjectionType": "ALL"
          }
        },
        {
          "IndexName": "GSI2",
          "KeyAttributes": {
            "PartitionKey": {
              "AttributeName": "entityType",
              "AttributeType": "S"
            },
            "SortKey": {
              "AttributeName": "endDate",
              "AttributeType": "S"
            }
          },
          "Projection": {
            "ProjectionType": "ALL"
          }
        },
        {
          "IndexName": "GSI3",
          "KeyAttributes": {
            "PartitionKey": {
              "AttributeName": "entityType",
              "AttributeType": "S"
            },
            "SortKey": {
              "AttributeName": "date",
              "AttributeType": "S"
            }
          },
          "Projection": {
            "ProjectionType": "ALL"
          }
        },
        {
          "IndexName": "GSI4",
          "KeyAttributes": {
            "PartitionKey": {
              "AttributeName": "sK",
              "AttributeType": "S"
            },
            "SortKey": {
              "AttributeName": "pK",
              "AttributeType": "S"
            }
          },
          "Projection": {
            "ProjectionType": "ALL"
          }
        },
        {
          "IndexName": "GSI5",
          "KeyAttributes": {
            "PartitionKey": {
              "AttributeName": "entityType",
              "AttributeType": "S"
            },
            "SortKey": {
              "AttributeName": "expiryDate",
              "AttributeType": "S"
            }
          },
          "Projection": {
            "ProjectionType": "ALL"
          }
        }
      ],
      "TableData": [],
      "DataAccess": {
        "MySql": {}
      },
      "SampleDataFormats": {
        "updatedAt": ["date", "ISO 8601 date and time"]
      },
      "BillingMode": "PAY_PER_REQUEST"
    }
  ]
}
```
