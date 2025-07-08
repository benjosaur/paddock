import { RemovalPolicy } from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  ProjectionType,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export interface DatabaseProps {
  readonly tableName: string;
  readonly removalPolicy?: RemovalPolicy;
}

export class Database extends Construct {
  public readonly table: Table;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    this.table = new Table(this, "WiveyCaresTable", {
      tableName: props.tableName,
      partitionKey: {
        name: "pK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sK",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
      deletionProtection: false, // Set to true for production
    });

    // GSI1: entityOwner (PK) + entityType (SK)
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "entityOwner",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "entityType",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    // GSI2: sK (PK) + pK (SK) - Inverted index
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: {
        name: "sK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "pK",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    // GSI3: entityType (PK) + recordExpiry (SK)
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI3",
      partitionKey: {
        name: "entityType",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "recordExpiry",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    // GSI4: entityType (PK) + date (SK)
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI4",
      partitionKey: {
        name: "entityType",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "date",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    // GSI5: entityType (PK) + postCode (SK)
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI5",
      partitionKey: {
        name: "entityType",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "postCode",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    // GSI6: entityType (PK) + entityOwner (SK)
    this.table.addGlobalSecondaryIndex({
      indexName: "GSI6",
      partitionKey: {
        name: "entityType",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "entityOwner",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });
  }
}
