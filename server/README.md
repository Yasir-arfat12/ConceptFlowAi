# ConceptFlow AI – Server README

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ (running locally or remotely)
- A Google Gemini API key (optional if using `AI_MODE=offline`)

## Setup

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

Required `.env` variables:
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://postgres:password@localhost:5432/conceptflow` |
| `JWT_SECRET` | At least 16 chars, random |
| `GEMINI_API_KEY` | Required when `AI_MODE=live` |

### 3. Create the database
```bash
psql -U postgres -c "CREATE DATABASE conceptflow;"
```

### 4. Run migrations
```bash
npm run db:migrate
```

### 5. Seed predefined content
```bash
npm run db:seed
```

### 6. Start the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs on port `3000` by default.

## All Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with auto-reload (Node --watch) |
| `npm start` | Production start |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed predefined topic content |
| `npm run db:reset` | Drop and recreate schema (dev only) |
| `npm test` | Run contract tests |
| `npm run test:contract` | Same as test |
| `npm run test:ai` | Quick AI connectivity test |
| `npm run smoke` | Full end-to-end smoke test (server must be running) |

## AI Modes

| `AI_MODE` | Behavior |
|-----------|----------|
| `live` (default) | Calls Gemini, falls back to predefined topics on failure |
| `offline` | Never calls Gemini, uses predefined topics only |

## Architecture

```
src/
├── config/         # env validation, logger
├── db/             # pg pool, migrate, reset
├── middleware/     # auth, validate, errorHandler
├── routes/         # express routers
├── controllers/    # request/response handling
├── services/       # business logic
│   └── ai/         # Gemini client, AI tasks, fallbacks
└── repositories/   # database queries
migrations/         # SQL migration files
seeds/              # idempotent seed data
tests/              # contract tests
scripts/            # testAi.js, smoke.js
```
