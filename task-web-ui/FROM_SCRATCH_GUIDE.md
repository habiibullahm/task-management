# Task Web UI - Complete From Scratch Guide

## 🎯 Overview
This guide documents the complete process of creating the task-web-ui from scratch, including every command, configuration, and decision made.

---

## 📦 Step 1: Project Initialization

### 1.1 Create Vite + React + TypeScript Project

```bash
# Navigate to project root
cd task-management

# Create new Vite project with React + TypeScript template
npm create vite@latest task-web-ui -- --template react-ts

# Navigate into the project
cd task-web-ui

# Install base dependencies
npm install
```

**What this creates:**
- Basic React 19 + TypeScript setup
- Vite configuration
- ESLint configuration
- Basic folder structure (src/, public/)
- package.json with minimal dependencies

---

## 🎨 Step 2: Install UI & Styling Dependencies

### 2.1 Install Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2.2 Install shadcn/ui Dependencies

```bash
# Core UI dependencies
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-avatar @radix-ui/react-popover @radix-ui/react-separator @radix-ui/react-toast

# Utility libraries
npm install class-variance-authority clsx tailwind-merge lucide-react
```

### 2.3 Install Additional UI Libraries

```bash
npm install sonner  # Toast notifications
```

---

## 🔧 Step 3: Install Core Dependencies

### 3.1 Routing

```bash
npm install react-router-dom
```

### 3.2 State Management

```bash
npm install zustand
```

### 3.3 HTTP Client

```bash
npm install axios
```

### 3.4 Form Handling & Validation

```bash
npm install react-hook-form zod @hookform/resolvers
```

### 3.5 Drag & Drop (for Kanban board)

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 3.6 Date Utilities

```bash
npm install date-fns
```

### 3.7 TypeScript Types

```bash
npm install -D @types/node
```

---

## ⚙️ Step 4: Configuration Files

### 4.1 Update `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 4.2 Update `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4.3 Update `tailwind.config.js`

```javascript
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more colors
      },
    },
  },
  plugins: [],
}
```

### 4.4 Update `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    /* ... more CSS variables */
  }
}
```

### 4.5 Create `.env.example`

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
```

### 4.6 Update `.gitignore`

```
node_modules
dist
.env
.env.local
*.local
coverage
.vscode/*
!.vscode/extensions.json
```

---

## 📁 Step 5: Create Folder Structure

```bash
# Create all necessary folders
mkdir -p src/components/ui
mkdir -p src/features/auth
mkdir -p src/features/dashboard
mkdir -p src/features/tasks
mkdir -p src/features/teams
mkdir -p src/features/boards
mkdir -p src/stores
mkdir -p src/services
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p src/lib
```

**Final Structure:**
```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   └── ProtectedRoute.tsx
├── features/
│   ├── auth/            # Login, Register
│   ├── dashboard/       # Dashboard
│   ├── tasks/           # Task management
│   ├── teams/           # Team management
│   └── boards/          # Kanban boards
├── stores/              # Zustand stores
├── services/            # API services
├── types/               # TypeScript types
├── hooks/               # Custom hooks
├── lib/                 # Utilities
└── utils/               # Helper functions
```

---

## 🔨 Step 6: Create Core Files

### 6.1 Type Definitions (`src/types/index.ts`)

```typescript
// Define all TypeScript types
export const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  // ...
}

// ... more types
```

### 6.2 API Client (`src/services/api.ts`)

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add request interceptor for JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for token refresh
// ...

export default apiClient;
```

### 6.3 Auth Service (`src/services/auth.service.ts`)

```typescript
import apiClient from './api';

export const authService = {
  login: async (credentials) => { /* ... */ },
  register: async (data) => { /* ... */ },
  logout: async () => { /* ... */ },
  getProfile: async () => { /* ... */ },
  // ...
};
```

### 6.4 Auth Store (`src/stores/auth.store.ts`)

```typescript
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => { /* ... */ },
  logout: async () => { /* ... */ },
  // ...
}));
```

---

## 🎨 Step 7: Create UI Components

Create shadcn/ui components manually or use CLI:

```bash
# If using shadcn CLI (optional)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
```

Or create manually in `src/components/ui/`:
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `label.tsx`

---

## 🔐 Step 8: Create Authentication Features

Create in `src/features/auth/`:
- `LoginForm.tsx`
- `RegisterForm.tsx`

Create `src/components/ProtectedRoute.tsx`

---

## 🏠 Step 9: Create Dashboard

Create `src/features/dashboard/Dashboard.tsx`

---

## 🛣️ Step 10: Set Up Routing

Update `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginForm } from './features/auth/LoginForm';
import { Dashboard } from './features/dashboard/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## ✅ Step 11: Test & Build

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 Step 12: Documentation

Create:
- `README.md` - Project overview
- `SETUP_SUMMARY.md` - Setup instructions
- `CODE_REVIEW.md` - Code review
- `.env.example` - Environment template

---

## 🎯 Summary

**Total Time:** ~2-3 hours for experienced developer  
**Total Files Created:** ~40 files  
**Total Lines of Code:** ~9,000 lines  
**Dependencies Installed:** ~50 packages  

**Key Technologies:**
- React 19, TypeScript 5.9, Vite 7.3
- Tailwind CSS, shadcn/ui
- Zustand, Axios, React Router
- React Hook Form, Zod

**Result:** Production-ready authentication system with modern UI

