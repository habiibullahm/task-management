# 🚀 Quick Start Guide

## ✅ Your API is Running!

Server: **http://localhost:3001**  
Health Check: **http://localhost:3001/api/v1/health**

---

## 🧪 Test in 3 Steps (VS Code REST Client)

### Step 1: Install REST Client Extension
1. Press `Ctrl+Shift+X` in VS Code
2. Search: **"REST Client"**
3. Install by **Huachao Mao**

### Step 2: Open `api.http` File
Open the `api.http` file in VS Code

### Step 3: Run These Requests in Order

#### ① Register a User
Find this section and click **"Send Request"**:
```http
### 1. Register New User
POST {{baseUrl}}/auth/register HTTP/1.1
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "abc-123",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "MEMBER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### ② Login (IMPORTANT - This saves the tokens!)
Find this section and click **"Send Request"**:
```http
### 3. Login User
# @name login  ← This is the magic line!
POST {{baseUrl}}/auth/login HTTP/1.1
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbGc...",  ← Automatically saved!
      "refreshToken": "eyJhbGc..."  ← Automatically saved!
    }
  }
}
```

#### ③ Get Profile (Uses automatic token!)
Find this section and click **"Send Request"**:
```http
### 4. Get User Profile (Protected Route)
GET {{baseUrl}}/auth/profile HTTP/1.1
Authorization: Bearer {{login.response.body.data.tokens.accessToken}}
                      ↑ This automatically uses the token from step ②
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "abc-123",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MEMBER",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 🎯 Understanding the Response Structure

### Login/Register Response Structure:
```
{
  success: true,
  message: "...",
  data: {
    user: { ... },
    tokens: {              ← Tokens are nested here!
      accessToken: "...",
      refreshToken: "..."
    }
  }
}
```

### How to Access Tokens:
```
{{login.response.body.data.tokens.accessToken}}
                       ↑     ↑      ↑
                       |     |      └─ Token field name
                       |     └──────── Tokens object
                       └────────────── Data wrapper
```

---

## 🔍 Troubleshooting

### ❌ "No value is resolved for given JSONPath"
**Cause:** You haven't run the login request yet in this session.

**Solution:** 
1. Run the **Login** request first (step ②)
2. Then run the **Get Profile** request (step ③)
3. The warning will disappear after login succeeds

### ❌ GET /api/v1/auth/profile 401 Unauthorized
**Cause:** Token not being extracted correctly.

**Solution:**
1. Make sure the login request has `# @name login` comment
2. Verify the JSONPath is: `{{login.response.body.data.tokens.accessToken}}`
3. Run login request before profile request

### ❌ Connection Refused
**Cause:** Server is not running.

**Solution:**
```bash
npm run dev
```

---

## 📊 View Your Data in Database

### Option 1: Prisma Studio (Easiest)
```bash
node node_modules/prisma/build/index.js studio
```
Opens at: http://localhost:5555

### Option 2: pgAdmin (Web UI)
1. Go to: http://localhost:5050
2. Login: `admin@admin.com` / `admin`
3. Connect to database (see DATABASE_ACCESS.md)

### Option 3: Command Line
```bash
docker exec -it task-management-db-dev psql -U postgres -d task_management_db
```

Then run:
```sql
SELECT * FROM users;
```

---

## 📚 More Information

- **TESTING_GUIDE.md** - Complete testing guide with 4 methods
- **DATABASE_ACCESS.md** - Database access guide
- **API_DOCUMENTATION.md** - Full API reference
- **TROUBLESHOOTING.md** - Common issues & solutions

---

## ✅ Success Checklist

- [ ] Server is running on port 3001
- [ ] REST Client extension installed
- [ ] Registered a new user (201 response)
- [ ] Logged in successfully (200 response with tokens)
- [ ] Got user profile (200 response with user data)
- [ ] Tokens are automatically extracted (no 401 errors)

---

## 🎉 You're All Set!

Your Task Management API is fully functional! The authentication system is working, and tokens are being automatically extracted and used in protected routes.

**Next Steps:**
1. Explore the database with Prisma Studio
2. Test other endpoints in `api.http`
3. Start implementing Team and Task management features

Happy coding! 🚀

