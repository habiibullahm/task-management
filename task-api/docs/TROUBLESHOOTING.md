# Troubleshooting Guide

## Common Issues and Solutions

### 1. Docker Desktop Not Running

**Error:**
```
unable to get image 'postgres:16-alpine': error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.49/images/postgres:16-alpine/json": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**Solution:**
1. **Start Docker Desktop** on your Windows machine
2. Wait for Docker Desktop to fully start (check the system tray icon)
3. Verify Docker is running:
   ```bash
   docker --version
   docker ps
   ```
4. Try the docker-compose command again:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

**Alternative: Run PostgreSQL Locally Without Docker**

If you prefer not to use Docker, you can install PostgreSQL directly:

1. **Download PostgreSQL**: https://www.postgresql.org/download/windows/
2. **Install PostgreSQL** with default settings
3. **Create Database**:
   ```bash
   # Using psql command line
   psql -U postgres
   CREATE DATABASE task_management_db;
   \q
   ```
4. **Update .env file**:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/task_management_db?schema=public
   ```
5. **Continue with migrations**:
   ```bash
   npm run prisma:migrate
   npm run dev
   ```

---

### 2. TypeScript Compilation Errors

**Error:**
```
TSError: ⨯ Unable to compile TypeScript:
src/app.ts:39:19 - error TS6133: 'req' is declared but its value is never read.
```

**Solution:**
✅ **Already Fixed!** The unused parameter has been prefixed with underscore (`_req`).

If you encounter similar errors:
- Prefix unused parameters with underscore: `_req`, `_res`, `_next`
- Or disable the rule in `tsconfig.json` (not recommended)

---

### 3. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

**Option 1: Change the port**
1. Edit `.env` file:
   ```env
   PORT=3001
   ```
2. Restart the server

**Option 2: Kill the process using port 3000**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or use PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

---

### 4. Database Connection Failed

**Error:**
```
❌ Database connection failed: Can't reach database server
```

**Solutions:**

**Check 1: Is PostgreSQL running?**
```bash
# If using Docker
docker-compose -f docker-compose.dev.yml ps

# If using local PostgreSQL
# Check Windows Services for "postgresql" service
```

**Check 2: Is DATABASE_URL correct?**
```env
# For Docker setup
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_management_db?schema=public

# For local PostgreSQL
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/task_management_db?schema=public
```

**Check 3: Restart PostgreSQL**
```bash
# Docker
docker-compose -f docker-compose.dev.yml restart postgres

# Local PostgreSQL
# Restart the service from Windows Services
```

---

### 5. Prisma Migration Errors

**Error:**
```
Error: P1001: Can't reach database server
```

**Solution:**
1. Ensure database is running
2. Check DATABASE_URL in `.env`
3. Try resetting migrations (⚠️ deletes all data):
   ```bash
   npx prisma migrate reset
   ```

**Error:**
```
Error: Migration failed to apply
```

**Solution:**
1. Drop and recreate the database:
   ```bash
   # Using psql
   psql -U postgres
   DROP DATABASE task_management_db;
   CREATE DATABASE task_management_db;
   \q
   ```
2. Run migrations again:
   ```bash
   npm run prisma:migrate
   ```

---

### 6. Module Not Found Errors

**Error:**
```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
# Reinstall dependencies
npm install

# Generate Prisma Client
npm run prisma:generate
```

---

### 7. Environment Variables Not Loading

**Error:**
```
Error: Environment variable DATABASE_URL is required but not set
```

**Solution:**
1. Ensure `.env` file exists in the project root
2. Copy from template if missing:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` with your actual values
4. Restart the server

---

### 8. Docker Compose Version Warning

**Warning:**
```
the attribute `version` is obsolete, it will be ignored
```

**Solution:**
This is just a warning and can be safely ignored. Docker Compose v2 doesn't require the version field, but it's kept for backward compatibility.

To remove the warning, you can delete the first line (`version: '3.8'`) from:
- `docker-compose.yml`
- `docker-compose.dev.yml`

---

## Quick Diagnostic Commands

### Check System Status
```bash
# Node.js version
node --version

# npm version
npm --version

# Docker status
docker --version
docker ps

# PostgreSQL status (if using Docker)
docker-compose -f docker-compose.dev.yml ps
```

### Check Application Status
```bash
# View logs
npm run dev

# Check database connection
npx prisma studio

# Test API
curl http://localhost:3000/api/v1/health
```

### Reset Everything (Nuclear Option)
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down -v

# Remove node_modules
rm -rf node_modules

# Reinstall
npm install

# Start fresh
docker-compose -f docker-compose.dev.yml up -d
npm run prisma:migrate
npm run dev
```

---

## Getting Help

If you're still experiencing issues:

1. **Check the logs** for detailed error messages
2. **Verify all prerequisites** are installed correctly
3. **Review the SETUP.md** guide for step-by-step instructions
4. **Check environment variables** in `.env` file
5. **Ensure ports are available** (3000, 5432, 5050)

## Useful Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Docker Documentation](https://docs.docker.com/)

