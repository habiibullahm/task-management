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

## Free-tier limits
- Web services sleep after ~15 minutes idle (cold start ~30–60s).
- Free Postgres expires after **30 days** — upgrade or export before then.
- Not suitable as always-on production without paid instances.

## CI
GitHub Actions (`.github/workflows/ci.yml`) builds API + UI on push/PR targeting `main`.
