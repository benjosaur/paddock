import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Database } from "./database";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = "paddock.health";
    const homeRoute = "/";
    const subdomainName = "www.paddock.health";
    const authDomainName = "auth.paddock.health";

    // SSL Certificate - Created in us-east-1 using cross-region reference
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      "Certificate",
      `arn:aws:acm:us-east-1:${this.account}:certificate/53bbfbcd-cbc1-4568-83a6-cb1d74052461`
    );

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, "PaddockUserPool", {
      userPoolName: "paddock-health-user-pool",
      selfSignUpEnabled: false,
      signInCaseSensitive: false,
      userInvitation: {
        emailSubject: "Your Paddock account has been created",
        emailBody:
          "Hello {username}, Your Paddock account has been created. Your temporary password is: {####}. Please log in and change your password.",
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // cooling off
    // const cognitoDomain = userPool.addDomain("PaddockCognitoDomain", {
    //   customDomain: {
    //     domainName: authDomainName,
    //     certificate: certificate,
    //   },
    // });

    const cognitoDomain = userPool.addDomain("PaddockCognitoDomain", {
      cognitoDomain: {
        domainPrefix: "auth-paddock-health",
      },
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(
      this,
      "PaddockUserPoolClient",
      {
        userPool,
        userPoolClientName: "paddock-health-user-pool-client",
        authFlows: {
          userSrp: true,
          userPassword: true,
          custom: false,
        },
        generateSecret: false,
        preventUserExistenceErrors: true,
        oAuth: {
          callbackUrls: ["https://" + domainName + homeRoute],
          logoutUrls: ["https://" + domainName + homeRoute],
          flows: {
            authorizationCodeGrant: true,
          },
        },
      }
    );

    const groups = [
      { id: "AdminGroup", name: "Admin", description: "Administrators group" },
      {
        id: "CoordinatorGroup",
        name: "Coordinator",
        description: "Coordinators group",
      },
      { id: "TrusteeGroup", name: "Trustee", description: "Trustees group" },
      { id: "FinanceGroup", name: "Finance", description: "Finance group" },
      {
        id: "TestGroup",
        name: "Test",
        description: "Tester Group (no prod data access)",
      },
    ];

    groups.forEach(({ id, name, description }) => {
      new cognito.CfnUserPoolGroup(this, id, {
        userPoolId: userPool.userPoolId,
        groupName: name,
        description,
      });
    });

    const s3CorsRule: s3.CorsRule = {
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
      allowedOrigins: ["*"],
      allowedHeaders: ["*"],
      maxAge: 300,
    };

    //frontend
    const s3Bucket = new s3.Bucket(this, "S3Bucket", {
      bucketName: `paddock-frontend-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.PRIVATE,
      cors: [s3CorsRule],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const oai = new cloudfront.OriginAccessIdentity(this, "OAI");
    s3Bucket.grantRead(oai);

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: s3Bucket,
              originAccessIdentity: oai,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD,
              },
            ],
          },
        ],
        // Add custom domain configuration
        // viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
        //   certificate,
        //   {
        //     aliases: [domainName, subdomainName],
        //     securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        //     sslMethod: cloudfront.SSLMethod.SNI,
        //   }
        // ),
        errorConfigurations: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: "/index.html",
          },
        ],
        // Redirect HTTP to HTTPS
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    );

    //backend
    const trpcLambda = new lambda.Function(this, "TrpcApiFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../server/dist"),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        // NODE_ENV: "production", doesnt work
      },
    });

    //databases
    const prodDatabase = new Database(this, "WiveyCaresTable", {
      tableName: "WiveyCares",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    const testDatabase = new Database(this, "TestTable", {
      tableName: "Test",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    prodDatabase.table.grantReadWriteData(trpcLambda);
    testDatabase.table.grantReadWriteData(trpcLambda);

    const api = new apigateway.RestApi(this, "TrpcApi", {
      restApiName: "TRPC API",
      description: "API for TRPC backend",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(trpcLambda);

    const trpcResource = api.root.addResource("trpc");

    trpcResource.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    //FE deployment
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [
        s3deploy.Source.asset("../client/dist"),
        s3deploy.Source.data(
          "config.json",
          JSON.stringify({
            apiUrl: api.url,
          })
        ),
      ],
      destinationBucket: s3Bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: distribution.distributionDomainName,
      description: "CloudFront Distribution URL",
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });

    new cdk.CfnOutput(this, "CognitoCloudFrontURL", {
      value: cognitoDomain.cloudFrontEndpoint,
      description: "Endpoint for Hosted Cognito UI",
    });
  }
}
