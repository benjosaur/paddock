# Paddock

Paddock is a case-management style app for WiveyCares data: tracking clients, volunteers, MPs, requests, care packages, training records, and MAG (Memory Activity Group) logs. It is built as a TypeScript monorepo with a React client, a server that talks to DynamoDB, and CDK-based infrastructure.

**Live site**: [paddock.health](https://paddock.health)

## Features

### Dashboard Analytics
Get real-time insights into your care operations with comprehensive analytics at a glance:
- **Active Requests Tracking**: Monitor clients with active care requests (2 shown in example)
- **Care Provider Utilization**: Track MPs and volunteers with active packages (1 MP, 0 volunteers shown)
- **Care Hours Management**: View current requested (40h) vs. brokered (20h) weekly care hours
- **Resource Allocation**: Identify gaps between care demand and supply to optimize scheduling

![Dashboard](.github/images/dashboard.png)

### Client Management with Deprivation Indicators
Track comprehensive client information with automatic deprivation analysis:
- **Contact & Service Information**: Complete client profiles with contact details, services needed, and care history
- **Automatic Deprivation Assessment**: Postcodes are automatically checked against the UK Government's [English Indices of Deprivation 2025](https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025/english-indices-of-deprivation-2025-statistical-release) to identify income and health deprivation levels
- **Request & Package Tracking**: View all care requests and packages associated with each client
- **Notes & Documentation**: Maintain detailed care notes and important client information

![Client Details Modal](.github/images/client-details-modal.png)

### Advanced Analytics Reporting
Generate detailed reports breaking down care hours by multiple dimensions:
- **Service Breakdown**: Hours analyzed by service type (Blue Badge, Sitting Service, Meal Prep, Overnight, Transport)
- **Locality Analysis**: Coverage across the [10 parishes of Wiveliscombe](https://wiveliscombe.com/parishes/) including Wiveliscombe, and surrounding areas
- **Cross-Dimensional Insights**: Service distribution within each locality to identify local care patterns
- **Temporal Trends**: Monthly and annual summaries with year-over-year comparisons
- **Exportable Reports**: Generate comprehensive PDF reports for trustees and stakeholders

![Analytics Report](.github/images/report.png)

## High-level architecture

- **Client (`client/`)**: Vite + React + TypeScript. Talks to the server via tRPC. UI is organized into forms, tables, and modals for the main entities (clients, volunteers, MPs, requests, packages, training, MAG logs).
- **Server (`server/`)**: TypeScript, structured around a **repository + service** pattern:
  - **Repositories**: thin DynamoDB data-access layers (query/put/delete). Each entity has its own repository in `server/db/<entity>/repository.ts`.
  - **Services**: business logic and validation. They parse inputs with Zod schemas (from `shared/`) and call repositories. Shared middleware `addDbMiddleware` stamps `updatedAt`/`updatedBy`.
  - **Schemas**: Zod definitions live under `shared/schemas` and mirrored DB shapes live in `server/db/*/schema.ts`.
  - **Routing**: tRPC routers under `server/trpc` expose the service methods to the client.
- **Shared (`shared/`)**: Common Zod schemas, types, and constants used by both client and server to keep validation aligned.
- **Infrastructure (`infra/`)**: AWS CDK stack that provisions the DynamoDB tables and supporting resources. `infra/lib/database.ts` defines the main table (`WiveyCares2`) and its GSIs; `infra/lib/edge.ts`/`images.ts` cover ancillary pieces.
- **Data ingestion (`server/scripts/`)**: utility scripts such as `preprocess-deprivation.ts` to load external datasets.

## Data model (DynamoDB)

See `docs/DATA.md` for the full column list and GSIs. In brief:

- Primary table `WiveyCares2` uses `pK`/`sK` keys and `entityType` discriminators to store all domain entities (clients, volunteers, MPs, requests, packages, training records, MAG logs).
- Supporting table `DeprivationCompact` (model `IndicesOfDeprivation2025`) stores postcode-level deprivation deciles.

## Local development

- Client: `cd client && npm install && npm run dev`
- Server: `cd server && npm install && npm run dev` (tRPC + DynamoDB local)
- Infra: `cd infra && npm install && npm run cdk synth` (requires AWS creds/CDK bootstrap)

## Testing

- Server tests: `cd server && npm test`
- Infra tests: `cd infra && npm test`

## Conventions

- Code-first validation with Zod; types inferred from schemas.
- Repository/service split: keep Dynamo queries isolated in repositories; keep business logic and validation in services.
- Shared types live in `shared/` and are imported by both client and server to avoid drift.
