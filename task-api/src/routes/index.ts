import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import teamRoutes from './team.routes';
import { prisma } from '../config/database';
import { MailerUtil } from '../utils/mailer.util';

const router = Router();

// Health check endpoint (includes DB ping; no internals leaked)
router.get('/health', async (_req, res) => {
  let db: 'ok' | 'degraded' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'degraded';
  }

  const healthy = db === 'ok';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'API is running' : 'API is degraded',
    timestamp: new Date().toISOString(),
    data: {
      db,
      mailerConfigured: MailerUtil.isConfigured(),
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/teams', teamRoutes);

export default router;
