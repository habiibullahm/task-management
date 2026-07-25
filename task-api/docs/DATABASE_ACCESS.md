# Database Access Guide

## 📊 Accessing Your PostgreSQL Database

You have **three ways** to access and manage your database:

---

## **Option 1: pgAdmin (Web UI) - Recommended for Beginners**

### Access pgAdmin
1. **Open your browser** and go to: http://localhost:5050
2. **Login credentials**:
   - Email: `admin@admin.com`
   - Password: `admin`

### Connect to Database
1. **Right-click** on "Servers" in the left panel
2. Click **"Register" → "Server"**
3. **General Tab**:
   - Name: `Task Management DB`
4. **Connection Tab**:
   - Host: `postgres` (if using Docker) or `localhost` (if local PostgreSQL)
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `postgres`
   - Password: `postgres`
   - Save password: ✅ (check this)
5. Click **"Save"**

### Browse Your Data
1. Expand: **Servers → Task Management DB → Databases → task_management_db → Schemas → public → Tables**
2. Right-click any table → **"View/Edit Data" → "All Rows"**

---

## **Option 2: Prisma Studio (Built-in GUI)**

### Start Prisma Studio
```bash
npx prisma studio
```

Or if PowerShell blocks it:
```bash
node node_modules/prisma/build/index.js studio
```

### Access
- Automatically opens in browser: http://localhost:5555
- **Features**:
  - View all tables
  - Add/Edit/Delete records
  - Filter and search data
  - Visual relationship explorer

---

## **Option 3: Command Line (psql)**

### Connect via Docker
```bash
# Connect to PostgreSQL container
docker exec -it task-management-db-dev psql -U postgres -d task_management_db
```

### Connect via Local PostgreSQL
```bash
# If you installed PostgreSQL locally
psql -U postgres -d task_management_db
```

### Useful SQL Commands

```sql
-- List all tables
\dt

-- Describe a table structure
\d users
\d teams
\d tasks

-- View all users
SELECT * FROM users;

-- View all teams
SELECT * FROM teams;

-- View all tasks
SELECT * FROM tasks;

-- Count records
SELECT COUNT(*) FROM users;

-- View users with their teams
SELECT u.email, u."firstName", u."lastName", tm.role, t.name as team_name
FROM users u
LEFT JOIN "TeamMember" tm ON u.id = tm."userId"
LEFT JOIN teams t ON tm."teamId" = t.id;

-- Exit psql
\q
```

---

## **Option 4: VS Code Extension (Optional)**

### Install PostgreSQL Extension
1. Open VS Code Extensions (Ctrl+Shift+X)
2. Search for: **"PostgreSQL" by Chris Kolkman**
3. Install it

### Connect to Database
1. Click the PostgreSQL icon in the sidebar
2. Click **"+"** to add connection
3. Enter connection details:
   - Host: `localhost`
   - User: `postgres`
   - Password: `postgres`
   - Port: `5432`
   - Database: `task_management_db`

---

## 🗄️ Database Schema Overview

Your database has the following tables:

### **users**
- User accounts with authentication
- Fields: id, email, password, firstName, lastName, role, isActive

### **teams**
- Team/project workspaces
- Fields: id, name, description, createdById

### **TeamMember**
- Team membership and roles
- Fields: id, userId, teamId, role, joinedAt

### **tasks**
- Task items with status and priority
- Fields: id, title, description, status, priority, assignedToId, teamId

### **Comment**
- Comments on tasks
- Fields: id, content, taskId, userId

### **ActivityLog**
- Audit trail of all actions
- Fields: id, action, entityType, entityId, userId

---

## 🔍 Quick Database Checks

### Check if database is running
```bash
# Docker
docker ps | grep postgres

# Local
# Check Windows Services for "postgresql" service
```

### View database logs
```bash
# Docker
docker logs task-management-db-dev

# Follow logs in real-time
docker logs -f task-management-db-dev
```

### Restart database
```bash
# Docker
docker restart task-management-db-dev

# Or restart all services
docker-compose -f docker-compose.dev.yml restart
```

---

## 🛠️ Database Management Commands

### Backup Database
```bash
# Docker
docker exec task-management-db-dev pg_dump -U postgres task_management_db > backup.sql

# Local
pg_dump -U postgres task_management_db > backup.sql
```

### Restore Database
```bash
# Docker
docker exec -i task-management-db-dev psql -U postgres task_management_db < backup.sql

# Local
psql -U postgres task_management_db < backup.sql
```

### Reset Database (⚠️ Deletes all data)
```bash
npm run prisma:migrate reset
```

---

## 📝 Connection Details Summary

| Parameter | Value |
|-----------|-------|
| **Host** | `localhost` (or `postgres` inside Docker) |
| **Port** | `5432` |
| **Database** | `task_management_db` |
| **Username** | `postgres` |
| **Password** | `postgres` |
| **Connection String** | `postgresql://postgres:postgres@localhost:5432/task_management_db` |

---

## 🎯 Recommended Workflow

1. **Development**: Use **Prisma Studio** for quick data viewing and editing
2. **Administration**: Use **pgAdmin** for complex queries and database management
3. **Debugging**: Use **psql** command line for quick checks
4. **VS Code**: Use PostgreSQL extension for integrated development

---

## 🆘 Troubleshooting

### Can't connect to database
1. Check if PostgreSQL is running: `docker ps`
2. Check connection string in `.env` file
3. Verify port 5432 is not blocked by firewall

### pgAdmin won't load
1. Check if container is running: `docker ps | grep pgadmin`
2. Restart pgAdmin: `docker restart task-management-pgadmin-dev`
3. Clear browser cache and try again

### Prisma Studio won't start
1. Make sure Prisma client is generated: `npm run prisma:generate`
2. Check DATABASE_URL in `.env` file
3. Verify database is accessible

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

