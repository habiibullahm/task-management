import { Router } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All team routes require authentication
router.use(AuthMiddleware.authenticate);

// TODO: Implement team routes
// GET /teams - Get all teams
// POST /teams - Create a new team
// GET /teams/:id - Get team by ID
// PUT /teams/:id - Update team
// DELETE /teams/:id - Delete team
// POST /teams/:id/members - Add member to team
// DELETE /teams/:id/members/:userId - Remove member from team

export default router;
