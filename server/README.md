# Paddock Backend

## Setup

1. Install dependencies:

```bash
bun install
```

2. Setup environment:

```bash
cp .env.example .env
# Edit .env with your database connection details
```

3. Initialize database:

```bash
bun run db:init
```

4. Seed database (optional):

```bash
bun run db:seed
```

5. Start development server:

```bash
bun run dev
```

## API Routes

The server provides a tRPC API with the following routers:

- `/trpc/mps` - MP management
- `/trpc/volunteers` - Volunteer management
- `/trpc/clients` - Client management
- `/trpc/mpLogs` - MP log entries
- `/trpc/volunteerLogs` - Volunteer log entries
- `/trpc/magLogs` - MAG log entries
- `/trpc/clientRequests` - Client requests

## Database Operations

- `bun run db:init` - Initialize database schema
- `bun run db:seed` - Seed with sample data
- `bun run db:reset` - Drop and recreate with sample data

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `CLIENT_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `NODE_ENV` - Environment (development/production)
