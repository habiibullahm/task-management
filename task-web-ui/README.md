# Task Management Web UI

React SPA for the Task Management API: personal and team tasks, Kanban board, comments, and live notifications.

## Features

- **Authentication**: Login, register, forgot/reset password, settings (profile User ID + change password)
- **Dashboard**: Task counts by status with deep-links into filtered lists
- **Tasks**: List with search/filters/sort; create/edit with team + assignee; comments on edit
- **Teams**: Create teams, manage members by User ID, role updates
- **Kanban Board**: Status columns with `@dnd-kit` drag-and-drop
- **Realtime**: Socket.IO client + notification bell/toasts
- **Responsive**: Works on desktop and mobile viewports

## Technology Stack

- React 19 + Vite + TypeScript
- Tailwind CSS + shadcn/ui (Radix)
- Zustand, Axios, React Router v7
- Sonner toasts, `@dnd-kit`, `socket.io-client`

## Prerequisites

- Node.js 18+
- npm 9+
- Task Management API running (default `http://localhost:3000`)

## Getting Started

```bash
npm install
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000/api/v1
# VITE_WS_URL=http://localhost:3000
npm run dev
```

UI: http://localhost:5173

## Project Structure

```
task-web-ui/
├── src/
│   ├── components/          # Shared UI, ProtectedRoute, NotificationBell, RealtimeProvider
│   ├── features/
│   │   ├── auth/            # Login, Register, Forgot/Reset, Settings
│   │   ├── dashboard/       # Dashboard
│   │   ├── tasks/           # List, form, comments
│   │   ├── teams/           # List, create, detail/members
│   │   └── boards/          # Kanban board
│   ├── stores/              # Zustand (auth, tasks, teams, notifications)
│   ├── services/            # API clients + realtime socket
│   ├── types/
│   └── lib/
├── e2e/                     # Playwright flows
└── package.json
```

## Routes

| Path | Page |
|------|------|
| `/login`, `/register` | Auth |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/dashboard` | Stats + quick actions |
| `/tasks`, `/tasks/new`, `/tasks/:id` | Task list / form (+ comments on edit) |
| `/boards` | Kanban |
| `/teams`, `/teams/new`, `/teams/:id` | Teams |
| `/settings` | Profile User ID + change password |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview build
- `npm run lint` — ESLint
- `npm run test:e2e` — Playwright e2e

## API Integration

Configured via `VITE_API_BASE_URL`. Main surfaces:

- Auth: register, login, refresh, profile, logout, change/forgot/reset password
- Tasks: CRUD + filters; comments nested under tasks
- Teams: CRUD + members
- Socket.IO: `VITE_WS_URL` (API host), path `/socket.io`

## Deferred polish

Not shipped (optional future work):

- Dark mode toggle (CSS tokens exist; no UI switch)
- Profile name/email edit API
- Server-side logout/token revocation
- Email verification
- File attachments / ActivityLog feed
- Role-based admin user-management APIs

## License

ISC
