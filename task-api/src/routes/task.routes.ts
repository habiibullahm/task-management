import { Router } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All task routes require authentication
router.use(AuthMiddleware.authenticate);

// TODO: Implement task routes
// GET /tasks - Get all tasks
// POST /tasks - Create a new task
// GET /tasks/:id - Get task by ID
// PUT /tasks/:id - Update task
// DELETE /tasks/:id - Delete task
// POST /tasks/:id/comments - Add comment to task

export default router;
