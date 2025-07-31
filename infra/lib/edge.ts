import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";

export class EdgeFunctionStack extends cdk.Stack {
  public readonly edgeFunctionVersion: lambda.IVersion;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: { account: props?.env?.account, region: "us-east-1" },
    });

    const edgeFunction = new lambda.Function(this, "EdgeFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lib/lambda"),
      handler: "edge-generated.handler",
      timeout: Duration.seconds(5), // Max 5 seconds for Lambda@Edge
      memorySize: 128, // Min memory for Lambda@Edge
    });

    this.edgeFunctionVersion = edgeFunction.currentVersion;

    // new cdk.CfnOutput(this, 'EdgeFunctionVersionArn', {
    //   value: this.edgeFunctionArn,
    //   exportName: 'EdgeFunctionVersionArn'
    // });
  }
}
