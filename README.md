# Paddock

Paddock is a case-management style app for WiveyCares data: tracking clients, volunteers, MPs, requests, care packages, training records, and MAG (Meet-and-Greet) logs. It is built as a TypeScript monorepo with a React client, a server that talks to DynamoDB, and CDK-based infrastructure.

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
