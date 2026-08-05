import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTaskStore } from "@/stores/task.store";
import { handleApiError } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TaskStatus } from "@/types";
import type { Task, TaskStatus as TaskStatusType } from "@/types";
import {
  formatPriority,
  formatTaskStatus,
  priorityBadgeClass,
} from "../tasks/task-labels";

const COLUMNS: TaskStatusType[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
  TaskStatus.CANCELLED,
];

function KanbanCard({
  task,
  isDragging,
}: {
  task: Task;
  isDragging?: boolean;
}) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-md border border-border bg-card p-3 shadow-sm",
        isDragging && "opacity-50 ring-2 ring-primary",
      )}
      {...listeners}
      {...attributes}
    >
      <button
        type="button"
        className="w-full text-left text-sm font-semibold hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/tasks/${task.id}`);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {task.title}
      </button>
      <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
        <span
          className={cn(
            "inline-flex items-center rounded border px-1.5 py-0.5 font-medium",
            priorityBadgeClass(task.priority),
          )}
        >
          {formatPriority(task.priority)}
        </span>
        {task.team?.name ? (
          <span className="rounded border px-1.5 py-0.5">{task.team.name}</span>
        ) : null}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
}: {
  status: TaskStatusType;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/60",
        isOver && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold">{formatTaskStatus(status)}</h3>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex max-h-[calc(100vh-14rem)] flex-col gap-2 overflow-y-auto p-2">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted-foreground">
            Drop tasks here
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function KanbanBoardPage() {
  const { tasks, isLoading, fetchTasks, updateTaskStatus } = useTaskStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useEffect(() => {
    fetchTasks({ limit: 100 });
  }, [fetchTasks]);

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(
      COLUMNS.map((s) => [s, [] as Task[]]),
    ) as Record<TaskStatusType, Task[]>;
    for (const task of tasks) {
      if (map[task.status]) {
        map[task.status].push(task);
      }
    }
    return map;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const taskId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    const nextStatus = COLUMNS.includes(overId as TaskStatusType)
      ? (overId as TaskStatusType)
      : tasks.find((t) => t.id === overId)?.status;

    if (!nextStatus) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === nextStatus) return;

    try {
      await updateTaskStatus(taskId, nextStatus);
      toast.success(`Moved to ${formatTaskStatus(nextStatus)}`);
    } catch (error) {
      toast.error(handleApiError(error, "Failed to update status"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-3xl font-bold">Kanban Board</h2>
        <p className="text-muted-foreground">
          Drag cards between columns to update status. Live updates arrive over
          WebSocket.
        </p>
      </div>

      {isLoading && tasks.length === 0 ? (
        <p className="text-muted-foreground">Loading board…</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={byStatus[status]}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? (
              <Card className="w-72 shadow-lg">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-sm">{activeTask.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                  {formatPriority(activeTask.priority)}
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
