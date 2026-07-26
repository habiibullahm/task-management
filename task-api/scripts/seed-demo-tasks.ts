/**
 * Seed demo tasks for an existing user.
 *
 * Usage (never commit real credentials):
 *   DATABASE_URL="postgresql://..." SEED_EMAIL="you@example.com" npx ts-node -r tsconfig-paths/register scripts/seed-demo-tasks.ts
 *
 * Optional: SEED_REPLACE=true deletes prior tasks with the same demo titles for that user before insert.
 */
import { PrismaClient, Priority, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_TASKS: Array<{
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueOffsetDays: number | null;
}> = [
  {
    title: 'Prep sprint demo slides',
    description: 'Outline problem → solution → live demo for portfolio post',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueOffsetDays: 1,
  },
  {
    title: 'Fix CORS on Render API',
    description: 'Confirm CORS_ORIGIN matches live UI URL',
    status: 'DONE',
    priority: 'URGENT',
    dueOffsetDays: -1,
  },
  {
    title: 'Run Prisma migrate on deploy',
    description: 'Ensure tables exist before first login',
    status: 'DONE',
    priority: 'HIGH',
    dueOffsetDays: -2,
  },
  {
    title: 'Add SPA fallback for /login',
    description: 'Static host should serve index.html for client routes',
    status: 'DONE',
    priority: 'HIGH',
    dueOffsetDays: -2,
  },
  {
    title: 'Write LinkedIn ship post',
    description: 'Cover vibe coding + production fixes table',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueOffsetDays: 0,
  },
  {
    title: 'Capture dashboard screenshots',
    description: 'Login, dashboard with tasks, create-task form',
    status: 'TODO',
    priority: 'HIGH',
    dueOffsetDays: 0,
  },
  {
    title: 'Polish empty-state copy',
    description: 'Friendlier message when task list is empty',
    status: 'TODO',
    priority: 'LOW',
    dueOffsetDays: 7,
  },
  {
    title: 'Plan Teams UI (later)',
    description: 'Defer shared boards; keep v1 personal-only',
    status: 'TODO',
    priority: 'LOW',
    dueOffsetDays: null,
  },
  {
    title: 'Review API health after cold start',
    description: 'Free tier wake-up ~30–60s; note in README',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    dueOffsetDays: 1,
  },
  {
    title: 'Cancel unused Docker Alpine attempt',
    description: 'Switched to Node runtime / Debian slim',
    status: 'CANCELLED',
    priority: 'LOW',
    dueOffsetDays: null,
  },
];

async function main() {
  const email = process.env.SEED_EMAIL?.trim().toLowerCase();
  if (!email) {
    throw new Error('SEED_EMAIL is required');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (!user) {
    throw new Error(`User not found for email: ${email}`);
  }

  const titles = DEMO_TASKS.map((t) => t.title);
  if (process.env.SEED_REPLACE === 'true') {
    const deleted = await prisma.task.deleteMany({
      where: { createdById: user.id, title: { in: titles } },
    });
    console.log(`Removed ${deleted.count} existing demo tasks`);
  }

  const now = Date.now();
  let created = 0;
  for (const task of DEMO_TASKS) {
    const existing = await prisma.task.findFirst({
      where: { createdById: user.id, title: task.title },
    });
    if (existing) {
      console.log(`Skip (exists): ${task.title}`);
      continue;
    }

    const dueDate =
      task.dueOffsetDays === null
        ? null
        : new Date(now + task.dueOffsetDays * 24 * 60 * 60 * 1000);

    await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate,
        createdBy: { connect: { id: user.id } },
        assignedTo: { connect: { id: user.id } },
      },
    });
    created += 1;
    console.log(`Created: ${task.title}`);
  }

  console.log(`Done. Created ${created} tasks for ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
