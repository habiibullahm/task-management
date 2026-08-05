# Task Management

Full-stack task manager: personal tasks, teams, Kanban board, comments, and live notifications — built as a training / portfolio app with real auth, Postgres, CI, and cloud deploy.

**Live demo**

- UI: https://task-management-ui-qapw.onrender.com/
- API: https://task-management-zmy7.onrender.com/ (`/api/v1/health`)

> Free Render services sleep when idle — the first request after inactivity can take ~30–60s.  
> **Try it:** register a **new** account on the live UI. Local users are not on the Render database.

## What this project is for

**For:** individuals and small teams managing to-dos in the browser.  
**Includes:** JWT auth, personal + team tasks, comments, Kanban drag-and-drop, Socket.IO notifications.

**Shipped:**

- Auth: register/login/refresh, change password, forgot/reset
- Tasks: CRUD, filters/search/sort, team + assignee
- Teams: CRUD + members (invite by User ID from Settings)
- Comments on task detail
- Kanban board (`/boards`) with `@dnd-kit`
- Realtime toasts + notification bell
- CI + Render deploy docs

**Deferred polish:** dark-mode toggle, profile name/email edit, email verification, token revocation, file attachments, ActivityLog feed, admin RBAC APIs.

Built to practice real product flow: auth, CRUD, Postgres, CI, and cloud deploy — while solving a concrete user need.

### Problem (why it exists)

| Pain | What happens |
|------|----------------|
| Tasks live in notes, chats, and memory | Easy to forget priorities and due work |
| Big tools (Jira, Notion-heavy setups) | Too much setup for personal lists |
| Spreadsheet / sticky-note chaos | No clear status, no ownership, hard to revisit |

Users need a **fast path**: account → list → create → update status → done — with data that survives refresh.

### Solution (what we ship)

| User need | How the app helps |
|-----------|-------------------|
| Keep tasks in one place | Dashboard + My Tasks + Kanban |
| Know what’s open vs done | Status on each task (todo → in progress → done) |
| Collaborate lightly | Teams, assignees, comments, live notifications |
| Stay signed in securely | Register/login; JWT; ownership + team membership checks |
| Use it from any browser | Web UI + REST API (+ Socket.IO) |

## Project flow

### High-level architecture

```
Browser (task-web-ui)
    │  HTTPS / JSON + Socket.IO
    ▼
Express API (task-api)  ──JWT auth──► protected routes
    │
    │  Prisma ORM
    ▼
PostgreSQL (users, tasks, teams, comments, …)
```

1. The **UI** talks to the API via `VITE_API_BASE_URL` (Axios) and `VITE_WS_URL` (Socket.IO).
2. The **API** validates input, checks JWT, runs business logic, and reads/writes via **Prisma**.
3. **Postgres** stores users, tasks, teams, and comments. Migrations apply on deploy.

### Request path (API layers)

```
Route → Middleware (auth / validation)
     → Controller
     → Service (business rules + realtime emit)
     → Repository (Prisma)
     → PostgreSQL
```

### User journey

```
/register or /login
        │
        ▼
  JWT saved in browser (auth store) + Socket.IO connect
        │
        ▼
   /dashboard  ←── stats / quick actions / notifications
        │
        ├── Create Task → /tasks/new
        ├── My Tasks → /tasks (filters, comments on edit)
        ├── Kanban → /boards (drag status)
        └── Teams → /teams
```

| Step | UI | API |
|------|----|-----|
| Sign up / sign in | `/register`, `/login` | `POST /auth/register`, `POST /auth/login` |
| Stay signed in | `ProtectedRoute` + tokens | `Authorization: Bearer <access>` |
| Dashboard | `/dashboard` | `GET /tasks` |
| Tasks | `/tasks`, `/tasks/new`, `/tasks/:id` | Task CRUD + comments |
| Board | `/boards` | Task status updates |
| Teams | `/teams` | Team CRUD + members |

### Data ownership

- Task creator can modify/delete; assignees and team members can view.
- Team actions respect OWNER / ADMIN / MEMBER roles.
- Comments: any task-accessible user can post; only the author can edit/delete.

### Dev → prod flow

```
feature/* branch
    → PR + GitHub Actions CI (build / tests)
    → merge to main (or staging)
    → Render redeploy (API + static UI + Postgres)
```

Locally: run API + UI with `npm run dev`, smoke-test the journey above, then push. Production UI must be rebuilt when `VITE_API_BASE_URL` / `VITE_WS_URL` change.

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
│   │   ├── realtime/      # Socket.IO hub
│   │   └── middleware/    # Auth, validation, errors
│   └── prisma/            # Schema + migrations
├── task-web-ui/       # Vite React SPA
│   └── src/
│       ├── features/      # auth, dashboard, tasks, teams, boards
│       ├── services/      # API clients + realtime
│       └── components/    # Shared UI, ProtectedRoute, notifications
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

Smoke path: register → Create Task → My Tasks → Board (drag status) → Teams → comment on a task.

## API overview

Base path: `/api/v1`

| Area | Endpoints |
|------|-----------|
| Health | `GET /health` |
| Auth | register, login, refresh, profile, logout, change/forgot/reset password |
| Tasks | CRUD + filters; `GET /tasks/:id/comments` |
| Teams | CRUD + members |
| Comments | `POST/PUT/DELETE /comments` |
| Realtime | Socket.IO `/socket.io` |

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
