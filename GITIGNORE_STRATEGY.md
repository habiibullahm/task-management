# .gitignore Strategy for Task Management Project

## Overview
This project uses a **multi-level .gitignore strategy** for a monorepo structure with backend (task-api) and frontend (task-web-ui).

## Structure

```
task-management/                    # Root directory
├── .gitignore                      # ✅ ROOT .gitignore (monorepo-wide)
├── task-api/
│   └── .gitignore                  # ✅ Backend-specific ignores
└── task-web-ui/
    └── .gitignore                  # ✅ Frontend-specific ignores
```

## Why This Approach?

### ✅ Benefits of Multi-Level .gitignore

1. **Separation of Concerns**
   - Root: Common ignores (OS files, IDE, global patterns)
   - Subprojects: Technology-specific ignores

2. **Flexibility**
   - Each project can have unique ignore rules
   - Easy to add new projects to monorepo

3. **Clarity**
   - Clear what's ignored at each level
   - Easier to maintain and debug

4. **Best Practice**
   - Standard for monorepo projects
   - Works well with Git submodules/workspaces

## File Breakdown

### 1. Root `.gitignore` (Monorepo Level)

**Purpose:** Global ignores for the entire repository

**Includes:**
- Operating system files (.DS_Store, Thumbs.db)
- IDE files (.vscode/, .idea/)
- Global environment files (.env)
- Common logs and temp files
- Build artifacts (dist/, build/)
- node_modules/

**Location:** `./gitignore`

### 2. Backend `.gitignore` (task-api)

**Purpose:** Node.js/Express/Prisma specific ignores

**Includes:**
- Prisma migrations (except .gitkeep)
- Docker override files
- Backend-specific build outputs
- Backend logs and coverage

**Location:** `task-api/.gitignore`

### 3. Frontend `.gitignore` (task-web-ui)

**Purpose:** React/Vite specific ignores

**Includes:**
- Vite build outputs (dist, dist-ssr)
- Frontend environment files
- Frontend coverage reports
- Vite-specific temp files

**Location:** `task-web-ui/.gitignore`

## Important Files to Track

### ✅ Should be Committed
- `.env.example` (template for environment variables)
- `README.md` files
- Source code (`src/`)
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Documentation (`docs/`)
- Prisma schema (`prisma/schema.prisma`)

### ❌ Should NOT be Committed
- `.env` (contains secrets)
- `node_modules/` (dependencies)
- `dist/` or `build/` (build outputs)
- IDE-specific files
- Log files
- Coverage reports
- Temporary files

## Environment Variables Strategy

### Backend (task-api)
- **Template:** `task-api/.env.example`
- **Actual:** `task-api/.env` (ignored)
- **Contains:** Database URL, JWT secrets, API keys

### Frontend (task-web-ui)
- **Template:** `task-web-ui/.env.example`
- **Actual:** `task-web-ui/.env` (ignored)
- **Contains:** API URLs, WebSocket URLs

## Git Commands Reference

### Check what's ignored
```bash
git status --ignored
```

### Check if a file is ignored
```bash
git check-ignore -v <filename>
```

### Force add an ignored file (if needed)
```bash
git add -f <filename>
```

### Clear Git cache (after updating .gitignore)
```bash
git rm -r --cached .
git add .
git commit -m "chore: update .gitignore"
```

## Verification Checklist

Before committing, verify:

- [ ] `.env` files are NOT in git
- [ ] `node_modules/` is NOT in git
- [ ] `dist/` and `build/` are NOT in git
- [ ] `.env.example` files ARE in git
- [ ] Source code is tracked
- [ ] Configuration files are tracked
- [ ] Documentation is tracked

## Common Issues & Solutions

### Issue: .env file was committed
```bash
# Remove from git but keep locally
git rm --cached task-api/.env
git rm --cached task-web-ui/.env
git commit -m "chore: remove .env files from git"
```

### Issue: node_modules was committed
```bash
# Remove from git
git rm -r --cached task-api/node_modules
git rm -r --cached task-web-ui/node_modules
git commit -m "chore: remove node_modules from git"
```

### Issue: .gitignore not working
```bash
# Clear cache and re-add
git rm -r --cached .
git add .
git commit -m "chore: fix .gitignore"
```

## Recommendation

✅ **Current Setup is CORRECT**

The multi-level .gitignore strategy is properly implemented:
- Root .gitignore for common ignores
- Subproject .gitignore for specific ignores
- .env.example files for documentation
- .env files properly ignored

**Status:** Ready for commit

