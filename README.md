# Task Management

A simple personal task manager you can open in the browser: sign up, capture work, track status, and see what’s on your plate — without enterprise project-tool clutter.

**Live demo**

- UI: https://task-management-ui-qapw.onrender.com/
- API: https://task-management-zmy7.onrender.com/ (`/api/v1/health`)

> Free Render services sleep when idle — the first request after inactivity can take ~30–60s.  
> **Try it:** register a **new** account on the live UI. Local users are not on the Render database.

## What this project is for

**For:** individuals who need a private place to manage their own to-dos (study, work, daily life).  
**Not for (yet):** team boards, shared workspaces, or heavy project planning — those are deferred.

**v1 includes:** JWT register/login, personal task CRUD + status, dashboard stats from your tasks.  
**Week 2 harden (personal product):** change password, forgot/reset (hashed single-use tokens; SMTP or optional Resend), task list filters (status incl. Cancelled, priority, search, sort), dual empty states, dashboard → filtered tasks, DB health ping (`ok`/`degraded`), demo seed script, deploy docs.  
**Coming later:** Teams UI.

Built as a full-stack training / portfolio app to practice real product flow: auth, CRUD, Postgres, CI, and cloud deploy — while still solving a concrete user need.

### Problem (why it exists)

| Pain | What happens |
|------|----------------|
| Tasks live in notes, chats, and memory | Easy to forget priorities and due work |
| Big tools (Jira, Notion-heavy setups) | Too much setup for personal lists |
| Spreadsheet / sticky-note chaos | No clear status, no ownership, hard to revisit |

Users need a **fast path**: account → list → create → update status → done — with data that survives refresh and stays private to them.

### Solution (what we ship)

| User need | How the app helps |
|-----------|-------------------|
| Keep tasks in one place | Dashboard + My Tasks backed by Postgres |
| Know what’s open vs done | Status on each task (e.g. todo → in progress → done) |
| Stay private | Register/login; JWT; you only see **your** tasks |
| Use it from any browser | Web UI + REST API (local or live Render demo) |

**Outcome for the user:** open the app, add what matters, update status as you work, and leave with a clear personal backlog — not another blank productivity template.

## Project flow

### High-level architecture

```
Browser (task-web-ui)
    │  HTTPS / JSON
    ▼
Express API (task-api)  ──JWT auth──► protected routes
    │
    │  Prisma ORM
    ▼
PostgreSQL (users, tasks, …)
```

1. The **UI** (Vite + React) talks only to the API via `VITE_API_BASE_URL` (Axios).
2. The **API** validates input, checks JWT on protected routes, runs business logic, and reads/writes via **Prisma**.
3. **Postgres** stores users and tasks. Migrations apply on deploy (`prisma migrate deploy`).

### Request path (API layers)

```
Route → Middleware (auth / validation)
     → Controller
     → Service (business rules)
     → Repository (Prisma)
     → PostgreSQL
```

Same shape for auth and tasks. Controllers stay thin; ownership checks (e.g. you only see your tasks) live in the service layer.

### User journey (v1)

```
/register or /login
        │
        ▼
  JWT saved in browser (auth store)
        │
        ▼
   /dashboard  ←── task counts / quick actions
        │
        ├── Create Task → /tasks/new → POST /api/v1/tasks → back to list
        │
        └── My Tasks → /tasks
                │
                ├── open /tasks/:id → edit (PUT) or change status
                └── delete (DELETE)
```

| Step | UI | API |
|------|----|-----|
| Sign up / sign in | `/register`, `/login` | `POST /auth/register`, `POST /auth/login` |
| Stay signed in | `ProtectedRoute` + stored tokens | `Authorization: Bearer <access>` |
| Dashboard | `/dashboard` | `GET /tasks` (stats derived in UI) |
| Create / edit | `/tasks/new`, `/tasks/:id` | `POST /tasks`, `PUT /tasks/:id` |
| List / delete | `/tasks` | `GET /tasks`, `DELETE /tasks/:id` |

Unauthenticated users hitting protected routes are redirected to `/login`. Expired access tokens trigger refresh (or logout) via the Axios client.

### Data ownership

- Each task belongs to the authenticated user (creator).
- List/get/update/delete only succeed for that user’s tasks.
- Teams / shared workspaces are in the schema for later; **v1 UI is personal tasks only**.

### Dev → prod flow

```
feature/* branch
    → PR + GitHub Actions CI (build / tests)
    → merge to main
    → Render redeploy (API + static UI + Postgres)
```

Locally: run API + UI with `npm run dev`, smoke-test the journey above, then push. Production UI must be rebuilt when `VITE_API_BASE_URL` changes (Vite bakes it in at build time).

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
├── task-api/          # Express + Prisma API
│   ├── src/
│   │   ├── routes/        # HTTP endpoints
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── repositories/  # Prisma data access
│   │   └── middleware/    # Auth, validation, errors
│   └── prisma/            # Schema + migrations
├── task-web-ui/       # Vite React SPA
│   └── src/
│       ├── features/      # auth, dashboard, tasks
│       ├── services/      # API client wrappers
│       └── components/    # Shared UI + ProtectedRoute
├── .github/           # CI
├── render.yaml        # Render Blueprint
├── DEPLOY.md          # Production deploy notes
└── TESTING.md         # Integration & e2e how-to
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
| Tasks | `GET`, `POST /tasks` · `GET`, `PUT`, `DELETE /tasks/:id` |

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
