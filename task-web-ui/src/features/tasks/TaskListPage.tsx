import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useTaskStore } from "@/stores/task.store";
import { useTeamStore } from "@/stores/team.store";
import { handleApiError } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";
import type { Priority, TaskStatus } from "@/types";
import { Priority as PriorityEnum, TaskStatus as Status } from "@/types";
import {
  formatPriority,
  formatTaskStatus,
  priorityBadgeClass,
} from "./task-labels";

const SEARCH_DEBOUNCE_MS = 300;

const STATUS_FILTERS: Array<{ label: string; value?: TaskStatus }> = [
  { label: "All", value: undefined },
  { label: "To Do", value: Status.TODO },
  { label: "In Progress", value: Status.IN_PROGRESS },
  { label: "In Review", value: Status.IN_REVIEW },
  { label: "Done", value: Status.DONE },
  { label: "Cancelled", value: Status.CANCELLED },
];

const PRIORITY_FILTERS: Array<{ label: string; value?: Priority }> = [
  { label: "All", value: undefined },
  { label: "Low", value: PriorityEnum.LOW },
  { label: "Medium", value: PriorityEnum.MEDIUM },
  { label: "High", value: PriorityEnum.HIGH },
  { label: "Urgent", value: PriorityEnum.URGENT },
];

type ListQuery = {
  status?: TaskStatus;
  priority?: Priority;
  sort?: "dueDate" | "updatedAt";
  search?: string;
  teamId?: string;
  assignedToMe?: boolean;
};

function parseListQuery(
  params: URLSearchParams,
  currentUserId?: string,
): ListQuery {
  const statusParam = params.get("status") as TaskStatus | null;
  const priorityParam = params.get("priority") as Priority | null;
  const sortParam = params.get("sort");
  const searchParam = params.get("search")?.trim() || undefined;
  const teamIdParam = params.get("teamId")?.trim() || undefined;
  const assignedToIdParam = params.get("assignedToId")?.trim() || undefined;

  return {
    status:
      statusParam && Object.values(Status).includes(statusParam)
        ? statusParam
        : undefined,
    priority:
      priorityParam && Object.values(PriorityEnum).includes(priorityParam)
        ? priorityParam
        : undefined,
    sort:
      sortParam === "dueDate" || sortParam === "updatedAt"
        ? sortParam
        : undefined,
    search: searchParam,
    teamId: teamIdParam,
    assignedToMe: Boolean(currentUserId && assignedToIdParam === currentUserId),
  };
}

export function TaskListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { teams, fetchTeams } = useTeamStore();
  const {
    tasks,
    isLoading,
    deleteTask,
    updateTaskStatus,
    setFilters,
    filters,
  } = useTaskStore();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const urlSearch = searchParams.get("search") ?? "";
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);
  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const syncUrl = (next: ListQuery) => {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.priority) params.set("priority", next.priority);
    if (next.sort === "dueDate") params.set("sort", "dueDate");
    if (next.search?.trim()) params.set("search", next.search.trim());
    if (next.teamId) params.set("teamId", next.teamId);
    if (next.assignedToMe && user?.id) params.set("assignedToId", user.id);
    setSearchParams(params, { replace: true });
  };

  // URL is the source of truth for list filters
  useEffect(() => {
    const next = parseListQuery(searchParams, user?.id);
    setFilters({
      status: next.status,
      priority: next.priority,
      sort: next.sort,
      search: next.search,
      teamId: next.teamId,
      assignedToId: next.assignedToMe && user?.id ? user.id : undefined,
      limit: 50,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.id]);

  // Debounce search → URL (which then drives fetch via the effect above)
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === urlSearch.trim()) return;

    const timer = window.setTimeout(() => {
      const current = parseListQuery(searchParams, user?.id);
      syncUrl({
        ...current,
        search: trimmed || undefined,
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, urlSearch]);

  const currentQuery = (): ListQuery => parseListQuery(searchParams, user?.id);

  const handleStatusFilter = (status?: TaskStatus) => {
    syncUrl({ ...currentQuery(), status, search: search.trim() || undefined });
  };

  const handlePriorityFilter = (priority?: Priority) => {
    syncUrl({
      ...currentQuery(),
      priority,
      search: search.trim() || undefined,
    });
  };

  const handleSort = (sort: "dueDate" | "updatedAt") => {
    syncUrl({
      ...currentQuery(),
      sort: sort === "updatedAt" ? undefined : sort,
      search: search.trim() || undefined,
    });
  };

  const handleTeamFilter = (teamId?: string) => {
    syncUrl({ ...currentQuery(), teamId, search: search.trim() || undefined });
  };

  const handleAssignedToMe = (enabled: boolean) => {
    syncUrl({
      ...currentQuery(),
      assignedToMe: enabled,
      search: search.trim() || undefined,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setSearchParams({}, { replace: true });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      toast.success("Task deleted");
    } catch (error) {
      toast.error(handleApiError(error, "Failed to delete task"));
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(id, status);
      toast.success("Status updated");
    } catch (error) {
      toast.error(handleApiError(error, "Failed to update status"));
    }
  };

  const hasActiveFilters = Boolean(
    filters.status ||
    filters.priority ||
    filters.search ||
    filters.teamId ||
    filters.assignedToId,
  );
  const empty = useMemo(
    () => !isLoading && tasks.length === 0,
    [isLoading, tasks.length],
  );
  const sortIsDueDate = filters.sort === "dueDate";
  const assignedToMe = Boolean(user?.id && filters.assignedToId === user.id);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Tasks</h2>
          <p className="text-muted-foreground">
            Create, edit, and update status for your personal and team tasks.
          </p>
        </div>
        <Button onClick={() => navigate("/tasks/new")}>Create Task</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 pt-6">
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tasks"
          />
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={`status-${filter.label}`}
                size="sm"
                variant={
                  filters.status === filter.value ? "default" : "outline"
                }
                aria-label={filter.value ? filter.label : "All statuses"}
                onClick={() => handleStatusFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by priority"
          >
            {PRIORITY_FILTERS.map((filter) => (
              <Button
                key={`priority-${filter.label}`}
                size="sm"
                variant={
                  filters.priority === filter.value ? "default" : "outline"
                }
                aria-label={filter.value ? filter.label : "All priorities"}
                onClick={() => handlePriorityFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by team"
          >
            <Button
              size="sm"
              variant={!filters.teamId ? "default" : "outline"}
              onClick={() => handleTeamFilter(undefined)}
            >
              All teams
            </Button>
            {teams.map((team) => (
              <Button
                key={team.id}
                size="sm"
                variant={filters.teamId === team.id ? "default" : "outline"}
                onClick={() => handleTeamFilter(team.id)}
              >
                {team.name}
              </Button>
            ))}
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by assignee"
          >
            <Button
              size="sm"
              variant={assignedToMe ? "default" : "outline"}
              onClick={() => handleAssignedToMe(!assignedToMe)}
            >
              Assigned to me
            </Button>
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Sort tasks"
          >
            <Button
              size="sm"
              variant={!sortIsDueDate ? "default" : "outline"}
              onClick={() => handleSort("updatedAt")}
            >
              Recently updated
            </Button>
            <Button
              size="sm"
              variant={sortIsDueDate ? "default" : "outline"}
              onClick={() => handleSort("dueDate")}
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
            <CardDescription>
              Create your first task to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/tasks/new")}>Create Task</Button>
          </CardContent>
        </Card>
      )}
      {empty && hasActiveFilters && (
        <Card>
          <CardHeader>
            <CardTitle>No tasks match</CardTitle>
            <CardDescription>
              Try clearing filters or adjusting your search.
            </CardDescription>
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
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {task.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                      priorityBadgeClass(task.priority),
                    )}
                  >
                    {formatPriority(task.priority)}
                  </span>
                  {task.team?.name ? (
                    <span className="inline-flex items-center rounded-md border px-2 py-0.5">
                      {task.team.name}
                    </span>
                  ) : null}
                  {task.assignedTo ? (
                    <span>
                      Assigned to {task.assignedTo.firstName}{" "}
                      {task.assignedTo.lastName}
                    </span>
                  ) : null}
                  {task.dueDate ? (
                    <span>
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={task.status}
                  onChange={(e) =>
                    handleStatusChange(task.id, e.target.value as TaskStatus)
                  }
                  aria-label={`Status for ${task.title}`}
                >
                  {Object.values(Status).map((status) => (
                    <option key={status} value={status}>
                      {formatTaskStatus(status)}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
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
    </div>
  );
}
