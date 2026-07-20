import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

export interface ImagesBucketProps {
  bucketName: string;
  // Browser origins allowed to PUT/GET via presigned URLs.
  corsOrigins: string[];
  isProd: boolean;
}

// Private bucket for client image attachments. The browser only ever reaches
// it through presigned URLs issued by the tRPC Lambda (upload = presigned PUT,
// view = presigned GET), so there is no CloudFront distribution, no public
// access and no bucket-level auth of its own.
export class ImagesBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: ImagesBucketProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: props.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      accessControl: s3.BucketAccessControl.PRIVATE,
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.PUT,
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: props.corsOrigins,
          allowedHeaders: ["*"],
          maxAge: 300,
        },
      ],
      // Images are user data: prod keeps the bucket on stack deletion, staging
      // cleans itself up (mirrors the Database removal policies).
      removalPolicy: props.isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !props.isProd,
    });
  }
}
