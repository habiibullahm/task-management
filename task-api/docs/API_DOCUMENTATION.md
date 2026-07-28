# API Documentation

Base URL: `http://localhost:3000/api/v1`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

## Endpoints

### Health Check

#### GET /health
Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication Endpoints

### Register User

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation Rules:**
- `email`: Must be a valid email address
- `password`: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `firstName`: Required, non-empty string
- `lastName`: Required, non-empty string

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "MEMBER",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `409 Conflict`: Email already registered
- `400 Bad Request`: Password doesn't meet requirements
- `422 Unprocessable Entity`: Validation errors

---

### Login

#### POST /auth/login
Authenticate a user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "MEMBER",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account is deactivated

---

### Refresh Token

#### POST /auth/refresh
Get a new access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired refresh token

---

### Get Profile

#### GET /auth/profile
Get the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MEMBER",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "teamMemberships": []
  }
}
```

**Error Responses:**
- `401 Unauthorized`: No token provided or invalid token
- `404 Not Found`: User not found

---

### Logout

#### POST /auth/logout
Logout the current user (client should remove tokens).

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Change Password

#### POST /auth/change-password
Change the authenticated user's password.

**Request Body:**
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass123!"
}
```

---

### Forgot Password

#### POST /auth/forgot-password
Request a one-time reset email (SMTP or Resend when configured). Always returns a generic success message.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### Reset Password

#### POST /auth/reset-password
Reset password using the emailed token.

**Request Body:**
```json
{
  "token": "raw-reset-token",
  "newPassword": "NewSecurePass123!"
}
```

---

## Task Endpoints

All task routes require authentication. Visibility includes tasks you created, are assigned to, or that belong to a team you are in. Only the creator can modify/delete.

### List Tasks

#### GET /tasks
Query params (all optional): `status`, `priority`, `search`, `sort` (`dueDate`|`updatedAt`), `teamId`, `assignedToId`, `page`, `limit`.

### Create Task

#### POST /tasks
```json
{
  "title": "Ship docs",
  "description": "Optional",
  "status": "TODO",
  "priority": "MEDIUM",
  "dueDate": "2026-12-31T00:00:00.000Z",
  "teamId": "uuid-optional",
  "assignedToId": "uuid-optional"
}
```

If `teamId` is set, the actor must be a team member. If both `teamId` and `assignedToId` are set, the assignee must be on that team.

### Get / Update / Delete Task

- `GET /tasks/:id`
- `PUT /tasks/:id` — same fields as create; `teamId` / `assignedToId` may be `null` to clear
- `DELETE /tasks/:id`

### List Task Comments

#### GET /tasks/:id/comments

---

## Team Endpoints

All require authentication. List returns only teams you belong to.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/teams` | Memberships for current user |
| POST | `/teams` | Body: `{ name, description? }` — creator becomes OWNER |
| GET | `/teams/:id` | Members + creator included |
| PUT | `/teams/:id` | OWNER or ADMIN |
| DELETE | `/teams/:id` | OWNER only |
| GET | `/teams/:id/members` | |
| POST | `/teams/:id/members` | Body: `{ userId, role?: "ADMIN"\|"MEMBER" }` |
| PUT | `/teams/:id/members/:memberId` | Body: `{ role }` — OWNER only; `memberId` is membership row id |
| DELETE | `/teams/:id/members/:memberId` | Cannot remove last OWNER |

---

## Comment Endpoints

| Method | Path | Notes |
|--------|------|-------|
| POST | `/comments` | Body: `{ taskId, content }` — requires task access |
| PUT | `/comments/:id` | Author only |
| DELETE | `/comments/:id` | Author only |

---

## Realtime (Socket.IO)

- Connect to the API host with path `/socket.io`
- Authenticate with JWT: `io(url, { auth: { token: accessToken } })`
- Server emits `notification` payloads:
  - `type`: `task:created` | `task:updated` | `task:deleted` | `comment:created`
  - `message`, `taskId`, `teamId`, `actorUserId`, `data?`

Fans out to task creator, assignee, and team members.

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content to return |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Health check when DB is degraded |

---

## Testing with cURL

### Complete Authentication Flow

1. **Register:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

3. **Get Profile:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

4. **Create a task:**
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "My first task", "priority": "HIGH" }'
```

5. **Refresh Token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

6. **Logout:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
