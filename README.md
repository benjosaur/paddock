# Paddock

Paddock is a case-management system designed to support charity microprovider networks linking self employed carers to locals in need. It tracks clients, volunteers, microproviders (MPs), care requests, packages, training records, and MAG (Memory Activity Group) logs through a TypeScript monorepo. Stack: React, tRPC backend, infra via AWS CDK.

**Live site**: [paddock.health](https://paddock.health)

## The Microprovider Model

Paddock directly supports [WiveyCares](https://wiveycares.net), a pioneering charity-run matching service operating in Wiveliscombe, Somerset. WiveyCares supports the self-employed microprovider care model championed by [Somerset County Council](https://www.somerset.gov.uk/care-and-support-for-adults/somerset-micro-enterprise-project/) - which has created over 1,250 micro-providers delivering 30,000+ hours of weekly support to nearly 6,000 people across the county. This model provides better quality care and at cheaper prices than hiring agency workers, and helps locals avoid expensive care home stays and remain in their own space. Community intergenerational bonds are also strengthened as local people get to know and care for those who live just down the street.

## Features

### Dashboard Analytics

- **Aggregates at a Glance**: Monitor active clients, microproviders, volunteers
- **Resource Allocation**: Identify gaps between requested hours and serviced hours (packages)

![Dashboard](.github/images/dashboard.png)

### Client Management with Deprivation Information

- **Comprehensive Metadata**
- **Automatic Deprivation Assessment**: Postcodes are automatically checked against the UK Government's [English Indices of Deprivation 2025](https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025/english-indices-of-deprivation-2025-statistical-release) to identify income and health deprivation levels
- **Request & Package Tracking**: View all care requests and packages associated with each client
- **Notes & Documentation**: Maintain detailed care notes and important client information

![Client Details Modal](.github/images/client-details-modal.png)

### Advanced Analytics Reporting For Funding Applications

- **Service Breakdown**: Hours analyzed by service type (Blue Badge, Sitting Service, Meal Prep, Overnight, Transport)
- **Locality Analysis**: Coverage across the [10 parishes of Wiveliscombe](https://wiveliscombe.com/parishes/) including Wiveliscombe, and surrounding areas
- **Cross-Dimensional Insights**: Service distribution within each locality to identify local care patterns
- **Temporal Trends**: Monthly and annual summaries with year-over-year comparisons

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
