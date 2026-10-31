# Task Management System

A full-stack collaborative task management platform with personal and team workspaces, drag-and-drop Kanban boards, real-time notifications, and comprehensive authentication.

**Live Demo:** [https://task-management-indol-zeta.vercel.app/](https://task-management-indol-zeta.vercel.app/)

> **Try it:** Register a new account to explore the full feature set. The demo uses a separate production database.

<!-- TODO: Add screenshots showing dashboard, Kanban board, and task detail views -->

## Features

### Core Functionality
- **Task Management**: Full CRUD operations with filtering, search, and sorting capabilities
- **Kanban Board**: Drag-and-drop interface for visual task organization with status columns
- **Team Collaboration**: Create teams, manage members, assign tasks, and track team workload
- **Real-time Updates**: Live notifications via Socket.IO for task changes, comments, and assignments
- **Comments System**: Threaded discussions on tasks with edit/delete permissions

### Authentication & Security
- **Complete Auth Flow**: Registration, login, JWT access/refresh tokens, password change
- **Password Reset**: Secure forgot-password flow with email verification
- **Authorization**: Role-based access control (Owner, Admin, Member) for team operations
- **Session Management**: Automatic token refresh and logout functionality

### User Experience
- **Responsive Design**: Mobile-first UI built with Tailwind CSS and shadcn/ui components
- **Dashboard Analytics**: Quick stats, recent activity, and priority task overview
- **Notification Center**: In-app notification bell with read/unread status
- **Profile Management**: User settings and profile customization

## Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        UI[React SPA<br/>Vite + React Router]
        WS[Socket.IO Client]
    end
    
    subgraph API["API Layer - Express"]
        Routes[Routes]
        Auth[Auth Middleware<br/>JWT Validation]
        Controllers[Controllers]
        Services[Services<br/>Business Logic]
        Repos[Repositories<br/>Prisma ORM]
        Realtime[Socket.IO Server<br/>Real-time Events]
    end
    
    subgraph Data["Data Layer"]
        DB[(PostgreSQL<br/>Users, Tasks, Teams<br/>Comments, Notifications)]
    end
    
    UI -->|REST API| Routes
    WS -->|WebSocket| Realtime
    Routes --> Auth
    Auth --> Controllers
    Controllers --> Services
    Services --> Repos
    Services --> Realtime
    Repos --> DB
    Realtime -.->|Push Updates| WS
    
    style Client fill:#e3f2fd
    style API fill:#f3e5f5
    style Data fill:#e8f5e9
```

### Request Flow

```
HTTP Request → Route Handler → Auth Middleware → Validation
    → Controller → Service (business logic + emit events)
    → Repository (Prisma) → PostgreSQL
    ← Response ← Controller ← Service ← Repository
```

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Vite, React Router 7 |
| **UI Components** | Tailwind CSS, Radix UI, shadcn/ui, Lucide Icons |
| **State Management** | Zustand (auth, notifications), React Hook Form |
| **Backend** | Node.js 20+, Express 4, TypeScript |
| **Database** | PostgreSQL 16+, Prisma ORM (migrations + type safety) |
| **Real-time** | Socket.IO 4 (WebSocket with fallback) |
| **Authentication** | JWT (access + refresh tokens), bcryptjs |
| **Validation** | Zod (frontend), express-validator (backend) |
| **Testing** | Jest + Supertest (API integration), Playwright (E2E) |
| **CI/CD** | GitHub Actions (build, test, deploy), Render Blueprint |
| **Development** | Docker Compose, ESLint, Prettier, Nodemon |

## Testing & Continuous Integration

### Test Coverage

The project includes comprehensive testing at multiple levels:

#### API & Database Integration Tests
- **Framework**: Jest + Supertest
- **Coverage**: Auth endpoints, CRUD operations, business logic validation
- **Database**: PostgreSQL test database with migrations
- **Location**: `task-api/src/__tests__/`
- **Run**: `cd task-api && npm run test:integration`

#### End-to-End Tests
- **Framework**: Playwright with Chromium
- **Scenarios**: Complete user journeys (register → create task → Kanban → teams)
- **Environment**: Full stack (API + UI + Database)
- **Location**: `task-web-ui/e2e/`
- **Run**: `cd task-web-ui && npm run test:e2e`

### CI Pipeline (GitHub Actions)

The CI workflow runs automatically on pull requests and pushes to `main`:

1. **Build + API Tests** (`api` job)
   - PostgreSQL 16 service container
   - Install dependencies, generate Prisma client
   - Run database migrations
   - Build TypeScript (API)
   - Execute integration test suite

2. **Build UI** (`web` job)
   - Install dependencies
   - Build production bundle with Vite

3. **E2E Tests** (`e2e` job)
   - Full stack setup (API + UI + Database)
   - Install Playwright browsers
   - Start API and preview server
   - Run E2E test suite with real browser

**Configuration**: `.github/workflows/ci.yml`

All tests must pass before merging to `main`.

## Quick Start

### Prerequisites

- **Node.js** 20+ and npm 9+
- **Docker** and Docker Compose (for local PostgreSQL)
- **Git**

### 1. Clone and Install

```bash
git clone <repository-url>
cd task-management

# Install API dependencies
cd task-api
npm ci

# Install UI dependencies
cd ../task-web-ui
npm ci
```

### 2. Database Setup (Docker)

The easiest way to run PostgreSQL locally:

```bash
cd task-api
docker compose -f docker-compose.dev.yml up -d postgres
```

This starts a PostgreSQL 16 container on port 5432 with default credentials.

**Verify it's running:**
```bash
docker ps | grep postgres
```

### 3. Configure Environment Variables

#### API Configuration
```bash
cd task-api
cp .env.example .env
```

Edit `.env` to set:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_management_db?schema=public
JWT_SECRET=your-secret-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-at-least-32-chars
CORS_ORIGIN=http://localhost:5173
```

#### UI Configuration
```bash
cd task-web-ui
cp .env.example .env
```

Edit `.env` to set:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=http://localhost:3000
```

### 4. Database Migration

```bash
cd task-api
npx prisma generate
npx prisma migrate deploy
```

### 5. Start Development Servers

**Terminal 1 - API:**
```bash
cd task-api
npm run dev
```
API runs at `http://localhost:3000`. Health check: `http://localhost:3000/api/v1/health`

**Terminal 2 - UI:**
```bash
cd task-web-ui
npm run dev
```
UI runs at `http://localhost:5173`

### 6. Create Your First Account

1. Open `http://localhost:5173` in your browser
2. Click **Register** and create an account
3. Explore: Dashboard → Create Task → My Tasks → Kanban Board → Teams

### Production Deployment (Docker Compose)

For self-hosted production deployment:

```bash
cd task-api
docker compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- API server (port 3000)
- pgAdmin web UI (port 5050, optional)

The API automatically runs migrations on startup. Build the UI separately and deploy as static assets.

**Note**: For cloud deployment (Vercel, Render), see [DEPLOY.md](./DEPLOY.md).

## Project Structure

```
task-management/
├── task-api/                  # Backend API
│   ├── src/
│   │   ├── routes/           # Express route definitions
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic + Socket.IO events
│   │   ├── repositories/     # Prisma data access layer
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── realtime/         # Socket.IO setup and handlers
│   │   └── __tests__/        # Integration tests
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # SQL migration files
│   ├── docker-compose.yml    # Production containers
│   └── docker-compose.dev.yml # Dev database only
│
├── task-web-ui/               # Frontend SPA
│   ├── src/
│   │   ├── features/         # Feature modules (auth, tasks, teams, boards)
│   │   ├── components/       # Shared UI components
│   │   ├── services/         # API client (Axios) + Socket.IO
│   │   ├── hooks/            # Custom React hooks
│   │   └── stores/           # Zustand state management
│   ├── e2e/                  # Playwright tests
│   └── public/               # Static assets
│
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions pipeline
├── render.yaml               # Render deployment blueprint
├── DEPLOY.md                 # Deployment guide
└── TESTING.md                # Testing documentation
```

## API Documentation

**Base URL**: `/api/v1`

### Endpoints

| Category | Endpoints |
|----------|-----------|
| **Health** | `GET /health` |
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| | `GET /auth/profile`, `PUT /auth/change-password` |
| | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| **Tasks** | `GET /tasks`, `POST /tasks`, `GET /tasks/:id`, `PUT /tasks/:id`, `DELETE /tasks/:id` |
| | `GET /tasks/:id/comments` (filters: status, priority, team, assignee, search) |
| **Teams** | `GET /teams`, `POST /teams`, `GET /teams/:id`, `PUT /teams/:id`, `DELETE /teams/:id` |
| | `POST /teams/:id/members`, `DELETE /teams/:id/members/:userId` |
| **Comments** | `POST /comments`, `PUT /comments/:id`, `DELETE /comments/:id` |
| **Real-time** | `Socket.IO /socket.io` (events: `task:created`, `task:updated`, `comment:added`, etc.) |

**Full documentation**: `task-api/docs/API_DOCUMENTATION.md`

## Roadmap & Known Limitations

This project demonstrates production-grade architecture and deployment practices. The following features are deferred for scope management:

### Planned Enhancements
- **Email Verification**: Currently optional; account activation via email token not enforced
- **Token Revocation**: Logout invalidates client tokens but doesn't blacklist on server
- **Profile Editing**: Users can change password but not name/email after registration
- **Dark Mode**: UI components support theming; toggle implementation pending
- **File Attachments**: Schema and UI placeholders exist; upload service not integrated
- **Activity Log**: Database tracks events; feed UI not implemented
- **Advanced RBAC**: Basic team roles work; granular permissions (e.g., task-level) not implemented
- **Invite by Email**: Current team invites require knowing the user ID (found in Settings)

### Technical Debt
- **Mobile UX Polish**: Responsive layout works; some touch targets and gestures need refinement
- **Pagination**: API supports limits; infinite scroll/pagination UI not added
- **Caching**: No Redis or CDN caching layer yet
- **Monitoring**: Basic logging exists; APM and error tracking not integrated

These limitations are documented to demonstrate awareness of scalable system design and prioritization in real-world projects.

## Deploy on Render

Use the included [`render.yaml`](./render.yaml) Blueprint to deploy the API, static UI, and Postgres. Full steps and troubleshooting: [DEPLOY.md](./DEPLOY.md).

## License

ISC

---

**Built by Muhammad** • [GitHub](https://github.com/) • Full-Stack & AI Engineering
