import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useTaskStore } from '@/stores/task.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationBell } from '@/components/NotificationBell';
import { TaskStatus } from '@/types';
import type { TaskStatus as TaskStatusType } from '@/types';

const STATUS_META: Record<TaskStatusType, { title: string; description: string }> = {
  [TaskStatus.TODO]: { title: 'To Do', description: 'Tasks waiting to start' },
  [TaskStatus.IN_PROGRESS]: { title: 'In Progress', description: "Tasks you're working on" },
  [TaskStatus.IN_REVIEW]: { title: 'In Review', description: 'Tasks awaiting review' },
  [TaskStatus.DONE]: { title: 'Completed', description: "Tasks you've finished" },
  [TaskStatus.CANCELLED]: { title: 'Cancelled', description: 'Tasks that were cancelled' },
};

const ALL_STATUSES = Object.values(TaskStatus);

export function Dashboard() {
  const { user, logout } = useAuthStore();
  const { tasks, fetchTasks, isLoading } = useTaskStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks({ limit: 100 });
  }, [fetchTasks]);

  const stats = useMemo(() => {
    const byStatus = ALL_STATUSES.reduce(
      (acc, status) => {
        acc[status] = tasks.filter((t) => t.status === status).length;
        return acc;
      },
      {} as Record<TaskStatusType, number>,
    );
    const total = tasks.length;
    return { total, byStatus };
  }, [tasks]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Task Management</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              Settings
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h2>
          <p className="text-muted-foreground">Here's what's happening with your tasks today.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            role="link"
            tabIndex={0}
            aria-label="View all tasks"
            onClick={() => navigate('/tasks')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/tasks');
              }
            }}
          >
            <CardHeader>
              <CardTitle>Total Tasks</CardTitle>
              <CardDescription>All your tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{isLoading ? '…' : stats.total}</p>
            </CardContent>
          </Card>

          {ALL_STATUSES.map((status) => {
            const meta = STATUS_META[status];
            return (
              <Card
                key={status}
                className="cursor-pointer transition-shadow hover:shadow-md"
                role="link"
                tabIndex={0}
                aria-label={`View ${meta.title} tasks`}
                onClick={() => navigate(`/tasks?status=${status}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/tasks?status=${status}`);
                  }
                }}
              >
                <CardHeader>
                  <CardTitle>{meta.title}</CardTitle>
                  <CardDescription>{meta.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">
                    {isLoading ? '…' : stats.byStatus[status]}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with these common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Button className="w-full" onClick={() => navigate('/tasks/new')}>
                Create Task
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/tasks')}>
                My Tasks
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/boards')}>
                Kanban Board
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/settings')}>
                Settings
              </Button>
              <Button className="w-full" variant="outline" onClick={() => navigate('/teams')}>
                Manage Teams
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
