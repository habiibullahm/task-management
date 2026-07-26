import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useTaskStore } from '@/stores/task.store';
import { handleApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Priority, TaskStatus } from '@/types';
import { Priority as PriorityEnum, TaskStatus as Status } from '@/types';
import { formatPriority, formatTaskStatus, priorityBadgeClass } from './task-labels';

const SEARCH_DEBOUNCE_MS = 300;

const STATUS_FILTERS: Array<{ label: string; value?: TaskStatus }> = [
  { label: 'All', value: undefined },
  { label: 'To Do', value: Status.TODO },
  { label: 'In Progress', value: Status.IN_PROGRESS },
  { label: 'In Review', value: Status.IN_REVIEW },
  { label: 'Done', value: Status.DONE },
  { label: 'Cancelled', value: Status.CANCELLED },
];

const PRIORITY_FILTERS: Array<{ label: string; value?: Priority }> = [
  { label: 'All', value: undefined },
  { label: 'Low', value: PriorityEnum.LOW },
  { label: 'Medium', value: PriorityEnum.MEDIUM },
  { label: 'High', value: PriorityEnum.HIGH },
  { label: 'Urgent', value: PriorityEnum.URGENT },
];

type ListQuery = {
  status?: TaskStatus;
  priority?: Priority;
  sort?: 'dueDate' | 'updatedAt';
  search?: string;
};

function parseListQuery(params: URLSearchParams): ListQuery {
  const statusParam = params.get('status') as TaskStatus | null;
  const priorityParam = params.get('priority') as Priority | null;
  const sortParam = params.get('sort');
  const searchParam = params.get('search')?.trim() || undefined;

  return {
    status: statusParam && Object.values(Status).includes(statusParam) ? statusParam : undefined,
    priority:
      priorityParam && Object.values(PriorityEnum).includes(priorityParam)
        ? priorityParam
        : undefined,
    // Omit default updatedAt from URL; only persist dueDate (or explicit updatedAt if present)
    sort: sortParam === 'dueDate' || sortParam === 'updatedAt' ? sortParam : undefined,
    search: searchParam,
  };
}

export function TaskListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuthStore();
  const { tasks, isLoading, deleteTask, updateTaskStatus, setFilters, filters } = useTaskStore();
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');

  const syncUrl = (next: ListQuery) => {
    const params = new URLSearchParams();
    if (next.status) params.set('status', next.status);
    if (next.priority) params.set('priority', next.priority);
    // Keep URLs short: only write non-default sort
    if (next.sort === 'dueDate') params.set('sort', 'dueDate');
    if (next.search?.trim()) params.set('search', next.search.trim());
    setSearchParams(params, { replace: true });
  };

  // URL is the source of truth for list filters
  useEffect(() => {
    const next = parseListQuery(searchParams);
    setSearch(next.search ?? '');
    setFilters({
      status: next.status,
      priority: next.priority,
      sort: next.sort,
      search: next.search,
      limit: 50,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounce search → URL (which then drives fetch via the effect above)
  useEffect(() => {
    const trimmed = search.trim();
    const urlSearch = searchParams.get('search')?.trim() || '';
    if (trimmed === urlSearch) return;

    const timer = window.setTimeout(() => {
      const current = useTaskStore.getState().filters;
      syncUrl({
        status: current.status,
        priority: current.priority,
        sort: current.sort,
        search: trimmed || undefined,
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleStatusFilter = (status?: TaskStatus) => {
    syncUrl({
      status,
      priority: filters.priority,
      sort: filters.sort,
      search: search.trim() || undefined,
    });
  };

  const handlePriorityFilter = (priority?: Priority) => {
    syncUrl({
      status: filters.status,
      priority,
      sort: filters.sort,
      search: search.trim() || undefined,
    });
  };

  const handleSort = (sort: 'dueDate' | 'updatedAt') => {
    syncUrl({
      status: filters.status,
      priority: filters.priority,
      sort: sort === 'updatedAt' ? undefined : sort,
      search: search.trim() || undefined,
    });
  };

  const clearFilters = () => {
    setSearch('');
    setSearchParams({}, { replace: true });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      toast.success('Task deleted');
    } catch (error) {
      toast.error(handleApiError(error, 'Failed to delete task'));
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(id, status);
      toast.success('Status updated');
    } catch (error) {
      toast.error(handleApiError(error, 'Failed to update status'));
    }
  };

  // Sort alone must not count as an "active filter" for empty-state messaging
  const hasActiveFilters = Boolean(filters.status || filters.priority || filters.search);
  const empty = useMemo(() => !isLoading && tasks.length === 0, [isLoading, tasks.length]);
  const sortIsDueDate = filters.sort === 'dueDate';

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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">My Tasks</h2>
            <p className="text-muted-foreground">Create, edit, and update status for your personal tasks.</p>
          </div>
          <Button onClick={() => navigate('/tasks/new')}>Create Task</Button>
        </div>

        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 pt-6">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={`status-${filter.label}`}
                  size="sm"
                  variant={filters.status === filter.value ? 'default' : 'outline'}
                  aria-label={filter.value ? filter.label : 'All statuses'}
                  onClick={() => handleStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by priority">
              {PRIORITY_FILTERS.map((filter) => (
                <Button
                  key={`priority-${filter.label}`}
                  size="sm"
                  variant={filters.priority === filter.value ? 'default' : 'outline'}
                  aria-label={filter.value ? filter.label : 'All priorities'}
                  onClick={() => handlePriorityFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sort tasks">
              <Button
                size="sm"
                variant={!sortIsDueDate ? 'default' : 'outline'}
                onClick={() => handleSort('updatedAt')}
              >
                Recently updated
              </Button>
              <Button
                size="sm"
                variant={sortIsDueDate ? 'default' : 'outline'}
                onClick={() => handleSort('dueDate')}
              >
                Due date
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && <p className="text-muted-foreground">Loading tasks...</p>}
        {empty && !hasActiveFilters && (
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
        {empty && hasActiveFilters && (
          <Card>
            <CardHeader>
              <CardTitle>No tasks match</CardTitle>
              <CardDescription>Try clearing filters or adjusting your search.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
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
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                        priorityBadgeClass(task.priority)
                      )}
                    >
                      {formatPriority(task.priority)}
                    </span>
                    {task.dueDate ? <span>Due {new Date(task.dueDate).toLocaleDateString()}</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    aria-label={`Status for ${task.title}`}
                  >
                    {Object.values(Status).map((status) => (
                      <option key={status} value={status}>
                        {formatTaskStatus(status)}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/tasks/${task.id}`)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(task.id)}
                    aria-label="Delete"
                  >
                    <Trash2 />
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
