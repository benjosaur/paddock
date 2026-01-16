# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Paddock is a care management system built with a monorepo structure using Bun workspaces. The application consists of a React frontend, Node.js/Express backend with tRPC, and AWS CDK infrastructure.

## Project Structure

- **`client/`** - React + TypeScript frontend using Vite, TailwindCSS, and Radix UI components
- **`server/`** - Node.js backend with Express, tRPC, and DynamoDB integration
- **`shared/`** - Shared TypeScript schemas and constants using Zod
- **`infra/`** - AWS CDK infrastructure code for deployment

## Development Commands

### Root Level (using Bun)
```bash
bun run dev          # Start client development server
bun run dev:server   # Start server development server  
bun run dev:full     # Start both client and server concurrently
bun run build        # Build client for production
bun run build:server # Build server for production
bun run lint         # Run ESLint on client code
```

### Client (React/Vite)
```bash
cd client
bun run dev          # Start development server on localhost:5173
bun run build        # Build for production (runs tsc -b && vite build)
bun run lint         # Run ESLint
bun run preview      # Preview production build
```

### Server (tRPC/Express)
```bash
cd server
bun run dev          # Start development server with --watch
bun run build        # Compile TypeScript to dist/
bun run deploy       # Build and deploy to AWS Lambda
bun run db:init      # Initialize database
bun run db:seed      # Seed database with test data
bun run db:reset     # Reset database
bun run db:test      # Run database tests
```

### Infrastructure (AWS CDK)
```bash
cd infra
bun run build        # Compile TypeScript
bun run test         # Run Jest tests
bun run cdk          # Run CDK commands
```

## Architecture

### Backend Architecture
The server uses a layered architecture with:
- **tRPC routers** (`server/trpc/routers/`) - API endpoints for different entities
- **Database services** (`server/db/*/service.ts`) - Business logic layer
- **Database repositories** (`server/db/*/repository.ts`) - Data access layer
- **Schemas** (`server/db/*/schema.ts`) - DynamoDB table schemas

### Dual Context System
The server supports both local development and AWS Lambda deployment:
- **Local context** (`server/trpc/local/`) - Express server for development
- **Production context** (`server/trpc/prod/`) - AWS Lambda handler for production

### Database Entities
Main entities include:
- Clients - Care recipients
- Volunteers - Care providers
- MPs - Members/care providers with member status
- Requests - Service requests
- Training Records - Volunteer and MP certifications
- Packages - Bundled services
- MAG Logs - Memory Activity Group session records
- Analytics - Usage metrics and reports

### Frontend Architecture
- React Router for routing (`client/src/routes/`)
- tRPC client for API calls (`client/src/utils/trpc.ts`)
- AWS Amplify for authentication
- Radix UI components with custom styling
- Permission-based access control (`client/src/components/PermissionGate.tsx`)

## Key Development Patterns

### Schema Validation
All data validation uses Zod schemas defined in `shared/schemas/index.ts` and shared between client and server.

### Database Operations
Follow the service/repository pattern:
1. Controllers call service methods
2. Services contain business logic
3. Repositories handle DynamoDB operations

### Component Structure
React components follow:
- Detail modals for viewing/editing entities
- Data tables with search and filtering
- Form components with validation
- UI components in `client/src/components/ui/`

### Authentication & Authorization
- AWS Amplify handles authentication
- Role-based permissions defined in `shared/permissions.ts`
- Permission gates protect sensitive operations

## Testing

Database services include test files (`server/db/*/test.ts`) that can be run with:
```bash
cd server && bun run db:test
```

Infrastructure tests use Jest:
```bash
cd infra && bun run test
```

## Deployment

The application uses AWS infrastructure:
- Lambda functions for serverless backend
- DynamoDB for data storage
- CloudFront for frontend distribution
- Cognito for authentication

Deploy with:
```bash
cd server && bun run deploy
```