import type { Priority, TaskStatus } from '@/types';
import { priorityTokenClass, statusTokenClass } from '@/theme/tokens';

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export function formatTaskStatus(status: TaskStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatPriority(priority: Priority): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

export function priorityBadgeClass(priority: Priority): string {
  return priorityTokenClass[priority] ?? 'border-border bg-muted text-muted-foreground';
}

export function statusBadgeClass(status: TaskStatus): string {
  return statusTokenClass[status] ?? 'border-border bg-muted text-muted-foreground';
}
