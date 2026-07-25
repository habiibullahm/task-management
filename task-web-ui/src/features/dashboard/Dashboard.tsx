import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useTaskStore } from '@/stores/task.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStatus } from '@/types';

export function Dashboard() {
  const { user, logout } = useAuthStore();
  const { tasks, fetchTasks, isLoading } = useTaskStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks({ limit: 100 });
  }, [fetchTasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const completed = tasks.filter((t) => t.status === TaskStatus.DONE).length;
    return { total, inProgress, completed };
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
            <span className="text-sm text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </span>
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Tasks</CardTitle>
              <CardDescription>All your tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{isLoading ? '…' : stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
              <CardDescription>Tasks you're working on</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{isLoading ? '…' : stats.inProgress}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
              <CardDescription>Tasks you've finished</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{isLoading ? '…' : stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with these common tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button onClick={() => navigate('/tasks/new')}>Create Task</Button>
              <Button variant="outline" onClick={() => navigate('/tasks')}>
                My Tasks
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.message('Teams coming in a later release')}
              >
                Manage Teams
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
