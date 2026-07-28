import { Router } from 'express';
import { body } from 'express-validator';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import taskController from '../controllers/task.controller';
import commentController from '../controllers/comment.controller';

const router = Router();

router.use(AuthMiddleware.authenticate);

const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be ISO8601'),
  body('assignedToId').optional({ nullable: true }).isUUID().withMessage('assignedToId must be a UUID'),
  body('teamId').optional({ nullable: true }).isUUID().withMessage('teamId must be a UUID'),
];

const updateValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional({ nullable: true }).isString(),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be ISO8601'),
  body('assignedToId').optional({ nullable: true }).isUUID().withMessage('assignedToId must be a UUID'),
  body('teamId').optional({ nullable: true }).isUUID().withMessage('teamId must be a UUID'),
];

router.get('/', taskController.list.bind(taskController));
router.post('/', ValidationMiddleware.validate(createValidation), taskController.create.bind(taskController));
router.get('/:id/comments', commentController.listByTask.bind(commentController));
router.get('/:id', taskController.getById.bind(taskController));
router.put('/:id', ValidationMiddleware.validate(updateValidation), taskController.update.bind(taskController));
router.delete('/:id', taskController.delete.bind(taskController));

export default router;
