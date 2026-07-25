# Task Management Web UI

A modern, collaborative task management dashboard built with React 19, TypeScript, and Tailwind CSS. This application provides a Trello/Jira-like interface for managing tasks, teams, and projects with real-time collaboration features.

## 🚀 Features

- **Authentication System**: Secure JWT-based authentication with login/register
- **Task Management**: Create, update, delete, and organize tasks
- **Team Collaboration**: Create teams and manage team members
- **Kanban Board**: Drag-and-drop task organization (coming soon)
- **Real-time Updates**: WebSocket integration for live collaboration (coming soon)
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark Mode Support**: Built-in dark mode theming

## 🛠️ Technology Stack

- **Framework**: React 19 with Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand
- **API Client**: Axios with interceptors
- **Routing**: React Router v7
- **Form Handling**: React Hook Form + Zod
- **Notifications**: Sonner
- **Drag & Drop**: @dnd-kit (coming soon)

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Task Management API running on `http://localhost:3000`

## 🚦 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
task-web-ui/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   └── ProtectedRoute.tsx
│   ├── features/           # Feature-based modules
│   │   ├── auth/           # Authentication (Login, Register)
│   │   ├── dashboard/      # Dashboard views
│   │   ├── tasks/          # Task management (coming soon)
│   │   ├── teams/          # Team management (coming soon)
│   │   └── boards/         # Kanban boards (coming soon)
│   ├── stores/             # Zustand state management
│   ├── services/           # API client and services
│   ├── types/              # TypeScript type definitions
│   ├── lib/                # Utility libraries
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── .env                    # Environment variables
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## 🔐 Authentication Flow

1. **Register**: Create a new account
2. **Login**: Authenticate with credentials
3. **Token Management**: Automatic token refresh
4. **Protected Routes**: Automatic redirect for unauthenticated users
5. **Logout**: Clear tokens and redirect

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔗 API Integration

The application integrates with the Task Management API at `http://localhost:3000/api/v1`

### Endpoints Used

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get current user profile
- `POST /auth/refresh` - Refresh access token

## 🚧 Coming Soon

- Kanban board with drag-and-drop
- Task details modal with comments
- Team management interface
- Real-time WebSocket updates
- Notifications center
- Search and filtering
- User profile and settings

## 📄 License

This project is licensed under the ISC License.
