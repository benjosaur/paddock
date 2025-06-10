import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = "paddock.health";
    const subdomainName = "www.paddock.health";

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

    // SSL Certificate - Created in us-east-1 using cross-region reference
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      "Certificate",
      // You'll need to replace this with your actual certificate ARN after creating it
      `arn:aws:acm:us-east-1:${this.account}:certificate/e4f64a88-53f6-4a87-ad97-441c1b238646`
    );

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
  }
}
