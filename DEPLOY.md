# Deploy to Render (free demo)

## Prerequisites
- GitHub repo: `habiibullahm/task-management`
- Render account (https://render.com) — no card needed for free web/static

## Branch workflow
- Protect `main` — merge only via pull requests
- Work on `feature/*` branches and open a PR into `main`
- No staging branch required for this portfolio/training repo

## Steps
1. Merge your feature PR into `main` (includes `render.yaml`).
2. Render Dashboard → **New** → **Blueprint** → connect the repo (deploy from `main`).
3. Set required env vars when prompted:
   - **API `CORS_ORIGIN`**: `https://<your-ui-service>.onrender.com`
   - **UI `VITE_API_BASE_URL`**: `https://<your-api-service>.onrender.com/api/v1`
4. Deploy. After API URL is known, update UI env and **redeploy UI** so Vite bakes the API URL into the static build.
5. Smoke test: register → Create Task → My Tasks → change status → edit → delete.

## API service settings (required)

Use **Node** runtime — do **not** use Docker for this service on Render.

| Setting | Value |
|---------|--------|
| Runtime | **Node** |
| Root Directory | `task-api` |
| Dockerfile Path | **empty / cleared** |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && node dist/server.js` |

`render.yaml` already configures this. If the service was created as Docker earlier, edit **Settings** and switch to Node, clear Dockerfile path, then **Manual Deploy**.

## Troubleshooting: Prisma `libssl.so.1.1` / OpenSSL

**Symptom:** Deploy fails or crash loop with missing `libssl.so.1.1` (Prisma engine vs Alpine OpenSSL 3).

**Cause:** Alpine-based Docker images (`node:*-alpine`) don’t ship OpenSSL 1.1; Prisma’s default engine expects it.

**Fix (fastest):**
1. Service → **Settings** → Runtime **Node** (not Docker)
2. Clear **Dockerfile Path**
3. Build/Start as in the table above
4. **Manual Deploy** → clear build cache if available, then deploy

Render’s Node image is Debian-based; this usually clears the error without Docker.

**If you keep Docker:** use `node:20-bookworm-slim` (not Alpine). The repo `task-api/Dockerfile` is already bookworm-slim, and `schema.prisma` includes `binaryTargets = ["native", "debian-openssl-3.0.x"]`.

**What to check in Render logs:**
- Events / Logs for `libssl`, `prisma`, `Query Engine`, `openssl`
- Confirm build ran `prisma generate` on the same OS as start
- Confirm `DATABASE_URL` is set from the Render Postgres addon

## Free-tier limits
- Web services sleep after ~15 minutes idle (cold start ~30–60s).
- Free Postgres expires after **30 days** — upgrade or export before then.
- Not suitable as always-on production without paid instances.

## CI
GitHub Actions (`.github/workflows/ci.yml`) builds API + UI on push/PR targeting `main`.
