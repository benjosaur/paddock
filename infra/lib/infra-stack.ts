import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as cognito from "aws-cdk-lib/aws-cognito";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = "paddock.health";
    const homeRoute = "/dashboard";
    const subdomainName = "www.paddock.health";
    const authDomainName = "auth.paddock.health";

    // SSL Certificate - Created in us-east-1 using cross-region reference
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      "Certificate",
      `arn:aws:acm:us-east-1:${this.account}:certificate/53bbfbcd-cbc1-4568-83a6-cb1d74052461`
    );

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "paddock-user-pool",
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

    userPool.addDomain("CognitoDomain", {
      customDomain: {
        domainName: authDomainName,
        certificate: certificate,
      },
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      userPoolClientName: "paddock-web-client",
      authFlows: {
        userSrp: true,
        userPassword: true,
        custom: false,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
      oAuth: {
        callbackUrls: ["https://" + domainName + homeRoute],
        logoutUrls: ["https://" + domainName],
        flows: {
          authorizationCodeGrant: true,
        },
      },
    });

    const groups = [
      { id: "AdminGroup", name: "Admin", description: "Administrators group" },
      {
        id: "CoordinatorGroup",
        name: "Coordinator",
        description: "Coordinators group",
      },
      { id: "TrusteeGroup", name: "Trustee", description: "Trustees group" },
      { id: "FinanceGroup", name: "Finance", description: "Finance group" },
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
        viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(
          certificate,
          {
            aliases: [domainName, subdomainName],
            securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            sslMethod: cloudfront.SSLMethod.SNI,
          }
        ),
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

    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset("../client/dist")],
      destinationBucket: s3Bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: distribution.distributionDomainName,
      description: "CloudFront Distribution URL",
    });

    new cdk.CfnOutput(this, "DomainURL", {
      value: `https://${domainName}`,
      description: "Custom Domain URL",
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });

    new cdk.CfnOutput(this, "Region", {
      value: this.region,
      description: "AWS Region",
    });
  }
}
