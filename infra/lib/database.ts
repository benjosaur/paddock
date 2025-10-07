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
      deletionProtection: false, // change
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: {
        name: "requestId",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "sK",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI2",
      partitionKey: {
        name: "entityType",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "endDate",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI3",
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

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI4",
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

    this.table.addGlobalSecondaryIndex({
      indexName: "GSI5",
      partitionKey: {
        name: "entityType",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "expiryDate",
        type: AttributeType.STRING,
      },
      projectionType: ProjectionType.ALL,
    });
  }
}
