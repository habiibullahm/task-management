# Quick Setup Guide

This guide will help you get the Task Management API up and running quickly.

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] npm v9+ installed
- [ ] PostgreSQL v14+ installed OR Docker installed
- [ ] Git installed

## Quick Start (Recommended for Development)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd task-management-api

# Install dependencies
npm install
```

### Step 2: Database Setup with Docker (Easiest)

```bash
# Start PostgreSQL and pgAdmin using Docker
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready (about 10 seconds)
```

The `.env` file is already configured for this setup!

### Step 3: Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# (Optional) Open Prisma Studio to view your database
npm run prisma:studio
```

### Step 4: Start Development Server

```bash
npm run dev
```

✅ Your API is now running at `http://localhost:3000/api/v1`

## Verify Installation

### Test the Health Endpoint

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Register Your First User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!@#",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!@#"
  }'
```

Save the `accessToken` from the response!

## Access Database Tools

### pgAdmin (Web UI)

1. Open http://localhost:5050
2. Login with:
   - Email: `admin@admin.com`
   - Password: `admin`
3. Add server:
   - Host: `postgres` (or `localhost` if running locally)
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres`
   - Database: `task_management_db`

### Prisma Studio

```bash
npm run prisma:studio
```

Opens at http://localhost:5555

## Alternative Setup (Without Docker)

If you prefer to use a local PostgreSQL installation:

1. **Install PostgreSQL** on your machine

2. **Create Database**
   ```bash
   createdb task_management_db
   ```

3. **Update .env**
   ```env
   DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/task_management_db?schema=public
   ```

4. **Continue from Step 3** in Quick Start

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:
1. Change `PORT=3000` to another port in `.env`
2. Restart the server

### Database Connection Failed

1. Check if PostgreSQL is running:
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

2. Check logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs postgres
   ```

3. Restart containers:
   ```bash
   docker-compose -f docker-compose.dev.yml restart
   ```

### Prisma Migration Errors

Reset the database (⚠️ This will delete all data):
```bash
npx prisma migrate reset
```

## Next Steps

1. ✅ API is running
2. ✅ Database is set up
3. ✅ First user created
4. 📖 Read the [API Documentation](README.md#-api-endpoints)
5. 🚀 Start building features!

## Useful Commands

```bash
# View all running containers
docker-compose -f docker-compose.dev.yml ps

# Stop all containers
docker-compose -f docker-compose.dev.yml down

# View application logs
npm run dev

# View database with Prisma Studio
npm run prisma:studio

# Create a new migration
npx prisma migrate dev --name your_migration_name
```

## Development Workflow

1. Make changes to code
2. Server auto-reloads (nodemon)
3. Test with curl/Postman
4. If schema changes:
   - Update `prisma/schema.prisma`
   - Run `npx prisma migrate dev`
   - Run `npm run prisma:generate`

Happy coding! 🎉

