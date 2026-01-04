# Devops

## Include Deprivation CSV for AWS deployment

Option A: Package the CSV inside the Lambda artifact (no S3)

1. Generate the compact CSV locally
   In repo root: cd server && bun run deprivation:preprocess
   This creates server/services/deprivation-compact.csv.
2. Make sure the CSV is copied into your build output
   If you build to dist/, add a copy step after your build (adjust if your build dir differs):
   mkdir -p dist/services
   cp server/services/deprivation-compact.csv dist/services/
   If you zip straight from source, ensure server/services/deprivation-compact.csv is included in the zip.
3. Set the env var for Lambda
   In your Lambda configuration (Console or IaC), set:
   DEPRIVATION_CSV_PATH=/var/task/dist/services/deprivation-compact.csv
   If you are not using dist/ and ship the source layout, set:
   DEPRIVATION_CSV_PATH=/var/task/server/services/deprivation-compact.csv
4. Deploy
   Rebuild, ensure the CSV is in the artifact, upload/deploy the new zip/stack.
5. Verify
   Invoke the Lambda once. If you log deprivation lookups, you should see matches for known postcodes. No S3 permissions needed.

Option B: Keep the CSV in S3 and download at cold start

6. Generate and upload
   cd server && bun run deprivation:preprocess
   Upload the resulting server/services/deprivation-compact.csv to S3, e.g. s3://your-bucket/deprivation/deprivation-compact.csv.
7. Add a tiny init downloader (runs once per container)
   On cold start, download to /tmp/deprivation-compact.csv if not present.
   Set process.env.DEPRIVATION_CSV_PATH = "/tmp/deprivation-compact.csv" in that init code (or pass that path to the service constructor).
8. Set env + IAM
   Env var (optional if you hardcode): DEPRIVATION_CSV_PATH=/tmp/deprivation-compact.csv
   Lambda role: allow s3:GetObject on the object (and s3:ListBucket if you list).
9. Deploy and verify
   Deploy the code with the init hook.
   First invocation should download; subsequent ones reuse the cached file.
