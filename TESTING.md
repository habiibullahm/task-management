# Integration & e2e tests

## Prerequisites
- Postgres running (local Docker: `cd task-api && docker compose -f docker-compose.dev.yml up -d postgres`)
- Create test DB once:
  ```bash
  docker exec -it task-management-db-dev psql -U postgres -c "CREATE DATABASE task_management_test;"
  ```
  (Ignore error if it already exists.)

## API + DB (Jest + Supertest + Prisma)
```bash
cd task-api
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_management_test?schema=public"
export DATABASE_URL="$TEST_DATABASE_URL"
npx prisma migrate deploy
npm run test:integration
```

Covers: health, register/login (users table), task CRUD (tasks table), auth required.

## UI + API + DB (Playwright)
Builds/serves API + UI preview and runs browser flows.
```bash
cd task-api && npm run build
cd ../task-web-ui
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/task_management_test?schema=public"
export DATABASE_URL="$TEST_DATABASE_URL"
export JWT_SECRET="test-jwt-secret-at-least-32-characters-long"
export JWT_REFRESH_SECRET="test-refresh-secret-at-least-32-chars"
npx playwright install chromium
npm run test:e2e
```

Covers: register → dashboard → create task → list; bad login error.
