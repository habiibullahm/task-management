# API Testing Guide

## 🧪 How to Test Your API

### **Method 1: Using VS Code REST Client (Recommended)**

#### Step 1: Install Extension
1. Open VS Code Extensions (Ctrl+Shift+X)
2. Search for: **"REST Client"** by Huachao Mao
3. Click **Install**

#### Step 2: Open api.http File
1. Open the `api.http` file in VS Code
2. You'll see **"Send Request"** links above each HTTP request

#### Step 3: Test the Authentication Flow

**Follow this order:**

1. **Register a User**
   - Find the `### 1. Register New User` section
   - Click **"Send Request"** above the POST line
   - You should see a 201 response with user data

2. **Login** (This is the KEY step!)
   - Find the `### 3. Login User` section
   - Click **"Send Request"**
   - You should see a 200 response with `accessToken` and `refreshToken`
   - **The tokens are now automatically saved!**

3. **Get Profile** (Uses automatic token)
   - Find the `### 4. Get User Profile` section
   - Click **"Send Request"**
   - Should return 200 with your user profile
   - **No need to copy/paste the token!**

4. **Refresh Token** (Uses automatic refresh token)
   - Find the `### 5. Refresh Access Token` section
   - Click **"Send Request"**
   - Should return new tokens

5. **Logout**
   - Find the `### 6. Logout` section
   - Click **"Send Request"**
   - Should return 200 success

#### How Automatic Tokens Work

The `api.http` file uses this magic syntax:
```
# @name login  ← This names the request "login"
POST {{baseUrl}}/auth/login
...

# Later requests can reference the login response:
Authorization: Bearer {{login.response.body.data.tokens.accessToken}}
```

The REST Client extension automatically:
1. Stores the response from the `login` request
2. Extracts the `accessToken` from `response.body.data.tokens.accessToken`
3. Uses it in subsequent requests

**No manual copy/paste needed!** 🎉

---

### **Method 2: Using PowerShell**

#### Register a User
```powershell
$registerBody = @{
    email = "test@example.com"
    password = "SecurePass123!@#"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
$registerResponse
```

#### Login and Save Tokens
```powershell
$loginBody = @{
    email = "test@example.com"
    password = "SecurePass123!@#"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"

# Save tokens to variables
$accessToken = $loginResponse.data.tokens.accessToken
$refreshToken = $loginResponse.data.tokens.refreshToken

Write-Host "Access Token: $accessToken"
Write-Host "Refresh Token: $refreshToken"
```

#### Get Profile (Using Token)
```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

$profileResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/profile" -Method Get -Headers $headers
$profileResponse
```

#### Refresh Token
```powershell
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

$refreshResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"

# Update access token
$accessToken = $refreshResponse.data.tokens.accessToken
```

#### Logout
```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/logout" -Method Post -Headers $headers
```

---

### **Method 3: Using cURL (Git Bash)**

#### Register
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login and Extract Token
```bash
# Login and save response
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!@#"
  }')

# Extract access token (requires jq)
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.refreshToken')

echo "Access Token: $ACCESS_TOKEN"
```

#### Get Profile
```bash
curl -X GET http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### **Method 4: Using Postman**

1. **Import Collection**:
   - Open Postman
   - Click **Import**
   - Drag and drop the `api.http` file
   - Postman will convert it to a collection

2. **Set Up Environment**:
   - Create a new environment
   - Add variable: `baseUrl` = `http://localhost:3001/api/v1`

3. **Auto-Save Tokens**:
   - In the Login request, go to **Tests** tab
   - Add this script:
   ```javascript
   const response = pm.response.json();
   pm.environment.set("accessToken", response.data.tokens.accessToken);
   pm.environment.set("refreshToken", response.data.tokens.refreshToken);
   ```

4. **Use Tokens**:
   - In protected routes, use: `{{accessToken}}`
   - Example: `Authorization: Bearer {{accessToken}}`

---

## 📊 Expected Responses

### Successful Register (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "MEMBER"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### Successful Login (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

### Successful Profile (200)
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid-here",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "MEMBER",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response (401)
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "errors": null
}
```

---

## ✅ Testing Checklist

- [ ] Health check returns 200
- [ ] Register new user returns 201
- [ ] Register duplicate email returns 409
- [ ] Register weak password returns 422
- [ ] Login with correct credentials returns 200
- [ ] Login with wrong password returns 401
- [ ] Get profile with valid token returns 200
- [ ] Get profile without token returns 401
- [ ] Get profile with invalid token returns 401
- [ ] Refresh token with valid refresh token returns 200
- [ ] Refresh token with invalid token returns 401
- [ ] Logout returns 200

---

## 🐛 Troubleshooting

### "Connection refused" error
- Make sure the server is running: `npm run dev`
- Check the server is on port 3001: Look for the startup banner

### "401 Unauthorized" on profile request
- Make sure you ran the login request first
- Check that the `@name login` is present in the login request
- Verify the token extraction syntax is correct

### Tokens not auto-filling
- Make sure you're using VS Code REST Client extension
- Ensure the login request has `# @name login` comment
- Run the login request before other requests

---

## 📚 Next Steps

After testing authentication:
1. Implement Team Management endpoints
2. Implement Task Management endpoints
3. Add more test cases
4. Set up automated testing with Jest

