import { Router } from 'express';
import { body } from 'express-validator';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import commentController from '../controllers/comment.controller';

const router = Router();

router.use(AuthMiddleware.authenticate);

const createValidation = [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('taskId').isUUID().withMessage('taskId must be a UUID'),
];

const updateValidation = [
  body('content').trim().notEmpty().withMessage('Content is required'),
];

router.post(
  '/',
  ValidationMiddleware.validate(createValidation),
  commentController.create.bind(commentController)
);
router.put(
  '/:id',
  ValidationMiddleware.validate(updateValidation),
  commentController.update.bind(commentController)
);
router.delete('/:id', commentController.delete.bind(commentController));

export default router;
