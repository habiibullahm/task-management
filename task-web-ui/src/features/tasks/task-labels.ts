import type { Priority, TaskStatus } from '@/types';

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
  switch (priority) {
    case 'HIGH':
    case 'URGENT':
      return 'border-red-200 bg-red-100 text-red-800';
    case 'MEDIUM':
      return 'border-amber-200 bg-amber-100 text-amber-800';
    case 'LOW':
      return 'border-green-200 bg-green-100 text-green-800';
    default:
      return 'border-gray-200 bg-gray-100 text-gray-800';
  }
}
