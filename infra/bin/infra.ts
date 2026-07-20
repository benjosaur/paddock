#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { InfraStack } from "../lib/infra-stack";
import { EdgeFunctionStack } from "../lib/edge";

const app = new cdk.App();

// const edgeStack = new EdgeFunctionStack(app, "EdgeFunctionStack", {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: "us-east-1", // Lambda@Edge must be in us-east-1
//   },
//   crossRegionReferences: true,
// });

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Production. The stack id predates the staging split and must never change —
// renaming it would make CloudFormation destroy and recreate every resource,
// including the Cognito user pool (all accounts) and the CloudFront URL.
const mainStack = new InfraStack(app, "PaddockStack", {
  stage: "prod",
  env,
  crossRegionReferences: true,
  // edgeFunctionVersion: edgeStack.edgeFunctionVersion,
});

// Staging: a fully isolated copy (own Cognito pool, tables, Lambda, CloudFront)
// at staging.paddockhealth.com. Deploy with `cdk deploy PaddockStack-Staging`
// (or `bun run deploy:staging` from server/) — never `--all`, which would ship
// one client build to both environments.
new InfraStack(app, "PaddockStack-Staging", {
  stage: "staging",
  env,
  crossRegionReferences: true,
});

// mainStack.addDependency(edgeStack);
