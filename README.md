# ConceptFlow AI

AI-powered personalized learning platform that teaches concepts step-by-step with checkpoints, contextual AI doubt-solving, and progress tracking.

## Project Structure

```
ConceptFlowAi/
├── frontend/          ← React + Vite frontend
│   ├── src/           ← Source code
│   ├── public/        ← Static assets
│   ├── package.json
│   └── vite.config.js
│
├── server/            ← Node.js + Express backend
│   ├── src/           ← Source code
│   ├── migrations/    ← SQL migration files
│   ├── seeds/         ← Seed data
│   ├── tests/         ← Contract tests
│   ├── scripts/       ← Utility scripts
│   └── package.json
│
└── docs/
    ├── API_CONTRACT.md
    └── DB_SCHEMA.md
```

## Quick Start

### Backend
```bash
cd server
cp .env.example .env          # configure DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4
- **Backend**: Node.js 20+, Express 4, PostgreSQL
- **Auth**: JWT + bcrypt
- **AI**: Google Gemini (with offline fallback)

## See Also

- [Server Setup](./server/README.md)
- [API Contract](./docs/API_CONTRACT.md)
- [DB Schema](./docs/DB_SCHEMA.md)
