import type { Task, TaskStatus, Priority } from '@prisma/client';
import taskRepository from '../repositories/task.repository';
import teamRepository from '../repositories/team.repository';
import userRepository from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';
import { CreateTaskDto, UpdateTaskDto } from '../types';

export interface ListTasksQuery {
  status?: string;
  priority?: string;
  search?: string;
  teamId?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseStatus(value?: string): TaskStatus | undefined {
  if (!value) return undefined;
  if (!TASK_STATUSES.includes(value as TaskStatus)) {
    throw new AppError(400, `Invalid status. Allowed: ${TASK_STATUSES.join(', ')}`);
  }
  return value as TaskStatus;
}

function parsePriority(value?: string): Priority | undefined {
  if (!value) return undefined;
  if (!PRIORITIES.includes(value as Priority)) {
    throw new AppError(400, `Invalid priority. Allowed: ${PRIORITIES.join(', ')}`);
  }
  return value as Priority;
}

function parseSort(value?: string): 'dueDate' | 'updatedAt' | undefined {
  if (!value) return undefined;
  if (value === 'dueDate' || value === 'updatedAt') return value;
  throw new AppError(400, 'Invalid sort. Allowed: dueDate, updatedAt');
}

function parseOptionalUuid(value: string | undefined, field: string): string | undefined {
  if (!value?.trim()) return undefined;
  const id = value.trim();
  if (!UUID_RE.test(id)) {
    throw new AppError(400, `${field} must be a valid UUID`);
  }
  return id;
}

export class TaskService {
  async list(userId: string, query: ListTasksQuery): Promise<{
    tasks: Task[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const teamId = parseOptionalUuid(query.teamId, 'teamId');
    const assignedToId = parseOptionalUuid(query.assignedToId, 'assignedToId');

    if (teamId) {
      const membership = await teamRepository.findMembership(teamId, userId);
      if (!membership) {
        throw new AppError(403, 'You are not a member of this team');
      }
    }

    const { tasks, total } = await taskRepository.findForUser({
      userId,
      status: parseStatus(query.status),
      priority: parsePriority(query.priority),
      search: query.search?.trim() || undefined,
      teamId,
      assignedToId,
      page,
      limit,
      sort: parseSort(query.sort),
    });

    return {
      tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async getById(userId: string, taskId: string): Promise<Task> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new AppError(404, 'Task not found');
    }
    await this.assertCanAccess(userId, task);
    return task;
  }

  async create(userId: string, data: CreateTaskDto): Promise<Task> {
    if (!data.title?.trim()) {
      throw new AppError(400, 'Title is required');
    }

    const priority = data.priority ? parsePriority(data.priority) : 'MEDIUM';
    const status = data.status ? parseStatus(data.status) : 'TODO';
    const teamId = data.teamId?.trim() || undefined;
    const assignedToId = data.assignedToId?.trim() || undefined;

    await this.validateTeamAndAssignee(userId, teamId, assignedToId);

    return taskRepository.create({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority,
      status,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdBy: { connect: { id: userId } },
      ...(teamId ? { team: { connect: { id: teamId } } } : {}),
      ...(assignedToId ? { assignedTo: { connect: { id: assignedToId } } } : {}),
    });
  }

  async update(userId: string, taskId: string, data: UpdateTaskDto): Promise<Task> {
    const existing = await taskRepository.findById(taskId);
    if (!existing) {
      throw new AppError(404, 'Task not found');
    }
    this.assertCanModify(userId, existing);

    const nextTeamId =
      data.teamId !== undefined ? data.teamId?.trim() || null : existing.teamId;
    const nextAssignedToId =
      data.assignedToId !== undefined
        ? data.assignedToId?.trim() || null
        : existing.assignedToId;

    if (data.teamId !== undefined || data.assignedToId !== undefined) {
      await this.validateTeamAndAssignee(
        userId,
        nextTeamId || undefined,
        nextAssignedToId || undefined
      );
    }

    return taskRepository.update(taskId, {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.status !== undefined ? { status: parseStatus(data.status) } : {}),
      ...(data.priority !== undefined ? { priority: parsePriority(data.priority) } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
        : {}),
      ...(data.teamId !== undefined
        ? data.teamId
          ? { team: { connect: { id: data.teamId.trim() } } }
          : { team: { disconnect: true } }
        : {}),
      ...(data.assignedToId !== undefined
        ? data.assignedToId
          ? { assignedTo: { connect: { id: data.assignedToId.trim() } } }
          : { assignedTo: { disconnect: true } }
        : {}),
    });
  }

  async delete(userId: string, taskId: string): Promise<void> {
    const existing = await taskRepository.findById(taskId);
    if (!existing) {
      throw new AppError(404, 'Task not found');
    }
    this.assertCanModify(userId, existing);
    await taskRepository.delete(taskId);
  }

  private async validateTeamAndAssignee(
    actorUserId: string,
    teamId?: string,
    assignedToId?: string
  ): Promise<void> {
    if (teamId) {
      const team = await teamRepository.findById(teamId);
      if (!team) {
        throw new AppError(404, 'Team not found');
      }
      const membership = await teamRepository.findMembership(teamId, actorUserId);
      if (!membership) {
        throw new AppError(403, 'You must be a member of the team to attach tasks to it');
      }
    }

    if (assignedToId) {
      const assignee = await userRepository.findById(assignedToId);
      if (!assignee || !assignee.isActive) {
        throw new AppError(404, 'Assignee not found');
      }

      if (teamId) {
        const assigneeMembership = await teamRepository.findMembership(teamId, assignedToId);
        if (!assigneeMembership) {
          throw new AppError(400, 'Assignee must be a member of the selected team');
        }
      }
    }
  }

  private async assertCanAccess(userId: string, task: Task): Promise<void> {
    if (task.createdById === userId || task.assignedToId === userId) {
      return;
    }
    if (task.teamId) {
      const membership = await teamRepository.findMembership(task.teamId, userId);
      if (membership) {
        return;
      }
    }
    throw new AppError(403, 'You do not have access to this task');
  }

  private assertCanModify(userId: string, task: Task): void {
    if (task.createdById !== userId) {
      throw new AppError(403, 'Only the task owner can modify this task');
    }
  }
}

export default new TaskService();
