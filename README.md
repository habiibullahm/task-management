# Task Management

Personal task manager with JWT auth, Postgres, and a React dashboard. Create, list, edit, and update task status from a browser UI backed by a REST API.

**Live demo**

- UI: https://task-management-ui-qapw.onrender.com/
- API: https://task-management-zmy7.onrender.com/ (`/api/v1/health`)

> Free Render services sleep when idle — the first request after inactivity can take ~30–60s.

## Features (v1)

- Register / login with JWT (access + refresh)
- Personal tasks: create, list, edit, delete, change status
- Dashboard stats from your tasks
- Teams UI deferred (“coming later”)

## Stack

| Layer | Tech |
|-------|------|
| API | Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT |
| UI | React 19, Vite, TypeScript, Tailwind, Zustand, React Router |
| Tests | Jest + Supertest (API), Playwright (e2e) |
| CI / Deploy | GitHub Actions, Render (`render.yaml`) |

## Repo layout

```
task-management/
├── task-api/       # Express + Prisma API
├── task-web-ui/    # Vite React SPA
├── .github/        # CI
├── render.yaml     # Render Blueprint
├── DEPLOY.md       # Production deploy notes
└── TESTING.md      # Integration & e2e how-to
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+ (or Docker for local Postgres)

## Local setup

### 1. Database

```bash
cd task-api
docker compose -f docker-compose.dev.yml up -d postgres
```

### 2. API

```bash
cd task-api
cp .env.example .env
# Edit DATABASE_URL / JWT secrets if needed
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev
```

API: http://localhost:3000  
Health: http://localhost:3000/api/v1/health

### 3. UI

```bash
cd task-web-ui
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000/api/v1
npm ci
npm run dev
```

UI: http://localhost:5173

Smoke path: register → Create Task → My Tasks → change status → edit → delete.

## API overview

Base path: `/api/v1`

| Area | Endpoints |
|------|-----------|
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, refresh / me / logout |
| Tasks | `GET|POST /tasks`, `GET|PUT|DELETE /tasks/:id` |

See `task-api/docs/API_DOCUMENTATION.md` for details.

## Tests

```bash
# API + DB integration
cd task-api && npm run test:integration

# UI e2e (API + browser)
cd task-web-ui && npm run test:e2e
```

Full prerequisites and env vars: [TESTING.md](./TESTING.md).

## Deploy (Render)

1. Merge to `main` via PR.
2. Deploy with Render Blueprint (`render.yaml`) or manual services.
3. Set `CORS_ORIGIN` (API) to the UI URL and `VITE_API_BASE_URL` (UI) to `https://<api>/api/v1`, then redeploy the UI.

Use **Node** runtime for the API (not Alpine Docker). Details and troubleshooting: [DEPLOY.md](./DEPLOY.md).

## Workflow

```
feature/*  →  PR  →  main  →  Render
```

Verify locally (`npm run dev` in both apps) before relying on a production deploy.
