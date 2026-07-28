import { prisma } from '../config/database';
import type { Comment, Prisma } from '@prisma/client';

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

const commentInclude = {
  user: { select: userSelect },
} as const;

export class CommentRepository {
  async create(data: Prisma.CommentCreateInput): Promise<Comment> {
    return prisma.comment.create({
      data,
      include: commentInclude,
    });
  }

  async findById(id: string): Promise<Comment | null> {
    return prisma.comment.findUnique({
      where: { id },
      include: commentInclude,
    });
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    return prisma.comment.findMany({
      where: { taskId },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, data: Prisma.CommentUpdateInput): Promise<Comment> {
    return prisma.comment.update({
      where: { id },
      data,
      include: commentInclude,
    });
  }

  async delete(id: string): Promise<Comment> {
    return prisma.comment.delete({ where: { id } });
  }
}

export default new CommentRepository();
