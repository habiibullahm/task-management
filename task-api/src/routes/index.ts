import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import teamRoutes from './team.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/teams', teamRoutes);

export default router;
