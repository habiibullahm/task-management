import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { LoginForm } from "./features/auth/LoginForm";
import { RegisterForm } from "./features/auth/RegisterForm";
import { ForgotPasswordForm } from "./features/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "./features/auth/ResetPasswordForm";
import { SettingsPage } from "./features/auth/SettingsPage";
import { Dashboard } from "./features/dashboard/Dashboard";
import { TaskListPage } from "./features/tasks/TaskListPage";
import { TaskFormPage } from "./features/tasks/TaskFormPage";
import { TeamListPage } from "./features/teams/TeamListPage";
import { TeamFormPage } from "./features/teams/TeamFormPage";
import { TeamDetailPage } from "./features/teams/TeamDetailPage";
import { KanbanBoardPage } from "./features/boards/KanbanBoardPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RealtimeProvider } from "./components/RealtimeProvider";
import { AppShell } from "./components/layout/AppShell";
import { applyThemeClass, readStoredTheme } from "./theme/tokens";

applyThemeClass(readStoredTheme());

function ProtectedShell() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <RealtimeProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />

          <Route element={<ProtectedShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TaskListPage />} />
            <Route path="/tasks/new" element={<TaskFormPage />} />
            <Route path="/tasks/:id" element={<TaskFormPage />} />
            <Route path="/boards" element={<KanbanBoardPage />} />
            <Route path="/teams" element={<TeamListPage />} />
            <Route path="/teams/new" element={<TeamFormPage />} />
            <Route path="/teams/:id" element={<TeamDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </RealtimeProvider>
    </BrowserRouter>
  );
}

export default App;
