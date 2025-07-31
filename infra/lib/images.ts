import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Duration } from "aws-cdk-lib";

export interface ImageProps {
  account: string;
  region: string;
  domains: string[];
  s3CorsRule: s3.CorsRule;
  ALLOWED_GROUPS: string[];
  edgeFunctionVersion: lambda.IVersion;
}

export class ImageService extends Construct {
  public readonly distribution: cloudfront.Distribution;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ImageProps) {
    super(scope, id);

    // Image Uploads
    const imageBucket = new s3.Bucket(this, "ImageBucket", {
      bucketName: `paddock-images-${props.account}-${props.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.PRIVATE,
      cors: [props.s3CorsRule],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.distribution = new cloudfront.Distribution(
      this,
      "ChatImagesDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(imageBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,

          // Add Lambda@Edge function
          edgeLambdas: [
            {
              functionVersion: props.edgeFunctionVersion,
              eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            },
          ],

          // Enable compression for faster loading
          compress: true,
        },

        // Price class for cost optimization
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US, Canada, Europe

        // Custom domain (optional)
        // domainNames: ['images.your-chat-app.com'],
        // certificate: acm.Certificate.fromCertificateArn(this, 'Cert', 'arn:aws:acm:...')
      }
    );

    const presignedUrlFunction = new lambda.Function(
      this,
      "PresignedUrlFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lib/lambda"),
        handler: "presigned.handler",
        timeout: Duration.seconds(30),

        environment: {
          BUCKET_NAME: imageBucket.bucketName,
          CDN_DOMAIN: this.distribution.distributionDomainName,
          ALLOWED_ORIGINS: JSON.stringify(props.domains),
          MAX_FILE_SIZE: "10485760", // 10MB in bytes
          ALLOWED_TYPES: JSON.stringify([
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
          ]),
          ALLOWED_GROUPS: props.ALLOWED_GROUPS.join(","),
          COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || "",
          COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || "",
        },

        // Memory allocation based on usage
        memorySize: 256,
      }
    );

    // Allow lambda function to write
    imageBucket.grantPut(presignedUrlFunction);
    imageBucket.grantPutAcl(presignedUrlFunction);

    // presignedUrlFunction.addToRolePolicy(
    //   new iam.PolicyStatement({
    //     effect: iam.Effect.ALLOW,
    //     actions: ["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject"],
    //     resources: [
    //       imageBucket.bucketArn,
    //       `${imageBucket.bucketArn}/*`,
    //     ],
    //   })
    // );

    this.api = new apigateway.RestApi(this, "ChatImageUploadApi", {
      restApiName: "Chat Image Upload API",
      description: "API for generating presigned URLs for chat image uploads",

      // CORS configuration
      defaultCorsPreflightOptions: {
        allowOrigins: props.domains,
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
      },
    });

    const uploadResource = this.api.root.addResource("upload");
    uploadResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(presignedUrlFunction)
    );
  }
}
