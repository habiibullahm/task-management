import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useTaskStore } from '@/stores/task.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { TaskStatus } from '@/types';
import { TaskStatus as Status } from '@/types';

const STATUS_FILTERS: Array<{ label: string; value?: TaskStatus }> = [
  { label: 'All', value: undefined },
  { label: 'To Do', value: Status.TODO },
  { label: 'In Progress', value: Status.IN_PROGRESS },
  { label: 'In Review', value: Status.IN_REVIEW },
  { label: 'Done', value: Status.DONE },
];

export function TaskListPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { tasks, isLoading, fetchTasks, deleteTask, updateTaskStatus, setFilters, filters } = useTaskStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTasks({ limit: 50 });
  }, [fetchTasks]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleStatusFilter = (status?: TaskStatus) => {
    setFilters({ ...filters, status, search: search || undefined, limit: 50 });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: search.trim() || undefined, limit: 50 });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      toast.success('Task deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(id, status);
      toast.success('Status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const empty = useMemo(() => !isLoading && tasks.length === 0, [isLoading, tasks.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-2xl font-bold">
              Task Management
            </Link>
            <span className="text-sm text-muted-foreground">My Tasks</span>
          </div>
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">My Tasks</h2>
            <p className="text-muted-foreground">Create, edit, and update status for your personal tasks.</p>
          </div>
          <Button onClick={() => navigate('/tasks/new')}>Create Task</Button>
        </div>

        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.label}
                  size="sm"
                  variant={filters.status === filter.value ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading && <p className="text-muted-foreground">Loading tasks...</p>}
        {empty && (
          <Card>
            <CardHeader>
              <CardTitle>No tasks yet</CardTitle>
              <CardDescription>Create your first task to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/tasks/new')}>Create Task</Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="text-left text-lg font-semibold hover:underline"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    {task.title}
                  </button>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Priority: {task.priority}
                    {task.dueDate ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                  >
                    {Object.values(Status).map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/tasks/${task.id}`)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(task.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
