import { prisma } from '../../src/config/database';

/** Wipe app tables between tests (FK-safe order). */
export async function resetDatabase(): Promise<void> {
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
}
