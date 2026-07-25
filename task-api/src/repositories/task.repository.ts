import { prisma } from '../config/database';
import type { Prisma, Task, TaskStatus, Priority } from '@prisma/client';

export interface TaskListParams {
  userId: string;
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
  page?: number;
  limit?: number;
}

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class TaskRepository {
  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({
      data,
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  }

  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  }

  async findForUser(params: TaskListParams): Promise<{ tasks: Task[]; total: number }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const ownershipFilter: Prisma.TaskWhereInput = {
      OR: [{ createdById: params.userId }, { assignedToId: params.userId }],
    };

    const searchFilter: Prisma.TaskWhereInput | undefined = params.search
      ? {
          OR: [
            { title: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const where: Prisma.TaskWhereInput = {
      AND: [
        ownershipFilter,
        ...(params.status ? [{ status: params.status }] : []),
        ...(params.priority ? [{ priority: params.priority }] : []),
        ...(searchFilter ? [searchFilter] : []),
      ],
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: { select: userSelect },
          assignedTo: { select: userSelect },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect },
      },
    });
  }

  async delete(id: string): Promise<Task> {
    return prisma.task.delete({ where: { id } });
  }
}

export default new TaskRepository();
