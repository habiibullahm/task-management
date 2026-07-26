import { prisma } from '../config/database';
import type { PasswordResetToken, Prisma } from '@prisma/client';

export class PasswordResetRepository {
  async create(data: Prisma.PasswordResetTokenCreateInput): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data });
  }

  async findValidByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async markUsed(id: string): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateForUser(userId: string): Promise<void> {
    await prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}

export default new PasswordResetRepository();
