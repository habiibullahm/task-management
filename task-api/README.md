# Task Management API

A collaborative task management dashboard application built with Node.js, TypeScript, Express, and Prisma. This application provides a robust backend API for managing tasks, teams, and user collaboration with JWT-based authentication.

## 🚀 Features

- **Multi-user Collaboration**: Support for multiple users working together
- **Team Management**: Create and manage teams with role-based access
- **Task Management**: Full CRUD operations for tasks with status tracking
- **Real-time Updates**: Built with scalability for real-time status updates
- **JWT Authentication**: Secure authentication with access and refresh tokens
- **RESTful API**: Clean, well-structured API following REST principles
- **Database ORM**: Prisma for type-safe database operations
- **Docker Support**: Containerized application for easy deployment

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher) OR **Docker** and **Docker Compose**

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
task-management-api/
├── src/
│   ├── config/           # Configuration files (database, environment)
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic layer
│   ├── repositories/     # Data access layer
│   ├── middleware/       # Custom middleware (auth, error handling, validation)
│   ├── routes/           # API route definitions
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions (JWT, password, response)
│   ├── app.ts            # Express application setup
│   └── server.ts         # Server entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── dist/                 # Compiled JavaScript (generated)
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose for production
├── docker-compose.dev.yml # Docker Compose for development
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variables template
└── package.json          # Project dependencies
```

## 🚦 Getting Started

### Option 1: Local Development (Without Docker)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure your database connection and JWT secrets.

4. **Start PostgreSQL**
   Make sure PostgreSQL is running on your machine.

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000/api/v1`

### Option 2: Docker Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-api
   ```

2. **Start development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `DATABASE_URL` to:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_management_db?schema=public
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

### Option 3: Full Docker Deployment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-api
   ```

2. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

The API will be available at `http://localhost:3000/api/v1`

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run docker:up` - Start Docker containers
- `npm run docker:down` - Stop Docker containers
- `npm run docker:build` - Build Docker images

## 🔐 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register a new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| GET | `/api/v1/auth/profile` | Get current user profile | Yes |
| POST | `/api/v1/auth/logout` | Logout user | Yes |

### Tasks (Coming Soon)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/tasks` | Get all tasks | Yes |
| POST | `/api/v1/tasks` | Create a new task | Yes |
| GET | `/api/v1/tasks/:id` | Get task by ID | Yes |
| PUT | `/api/v1/tasks/:id` | Update task | Yes |
| DELETE | `/api/v1/tasks/:id` | Delete task | Yes |

### Teams (Coming Soon)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/teams` | Get all teams | Yes |
| POST | `/api/v1/teams` | Create a new team | Yes |
| GET | `/api/v1/teams/:id` | Get team by ID | Yes |
| PUT | `/api/v1/teams/:id` | Update team | Yes |
| DELETE | `/api/v1/teams/:id` | Delete team | Yes |

## 📊 Database Schema

The application uses the following main entities:

- **User**: User accounts with authentication
- **Team**: Teams for organizing users
- **TeamMember**: Junction table for team membership
- **Task**: Tasks with status, priority, and assignments
- **Comment**: Comments on tasks
- **ActivityLog**: Audit trail for changes

See `prisma/schema.prisma` for the complete schema definition.

## 🔒 Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/task_management_db?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

## 🧪 Testing the API

### Using cURL

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Get Profile (with token):**
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman or Insomnia

1. Import the API endpoints
2. Set the base URL to `http://localhost:3000/api/v1`
3. For authenticated endpoints, add the `Authorization` header with value `Bearer YOUR_ACCESS_TOKEN`

## 🐳 Docker Services

When using Docker Compose, the following services are available:

- **app**: The Node.js application (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **pgadmin**: Database management UI (port 5050)
  - URL: http://localhost:5050
  - Email: admin@admin.com
  - Password: admin

## 🏗️ Architecture

The application follows a layered architecture:

1. **Routes Layer**: Defines API endpoints and applies middleware
2. **Controller Layer**: Handles HTTP requests and responses
3. **Service Layer**: Contains business logic
4. **Repository Layer**: Handles data access and database operations
5. **Middleware Layer**: Authentication, validation, error handling

## 🔧 Development Guidelines

- Follow TypeScript best practices
- Use Prisma for all database operations
- Implement proper error handling
- Add validation for all inputs
- Write meaningful commit messages
- Keep functions small and focused
- Use async/await for asynchronous operations

## 📦 Deployment

### Production Deployment with Docker

1. Update environment variables in `docker-compose.yml`
2. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

3. Start the server:
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- Prisma team for the amazing ORM
- All contributors who help improve this project

