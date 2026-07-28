import { Router } from 'express';
import { body } from 'express-validator';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import teamController from '../controllers/team.controller';

const router = Router();

router.use(AuthMiddleware.authenticate);

const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional().isString(),
];

const updateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('description').optional({ nullable: true }).isString(),
];

const addMemberValidation = [
  body('userId').isUUID().withMessage('userId must be a UUID'),
  body('role')
    .optional()
    .isIn(['ADMIN', 'MEMBER'])
    .withMessage('Invalid role. Allowed: ADMIN, MEMBER'),
];

const updateMemberRoleValidation = [
  body('role')
    .isIn(['OWNER', 'ADMIN', 'MEMBER'])
    .withMessage('Invalid role. Allowed: OWNER, ADMIN, MEMBER'),
];

router.get('/', teamController.list.bind(teamController));
router.post(
  '/',
  ValidationMiddleware.validate(createValidation),
  teamController.create.bind(teamController)
);
router.get('/:id', teamController.getById.bind(teamController));
router.put(
  '/:id',
  ValidationMiddleware.validate(updateValidation),
  teamController.update.bind(teamController)
);
router.delete('/:id', teamController.delete.bind(teamController));

router.get('/:id/members', teamController.listMembers.bind(teamController));
router.post(
  '/:id/members',
  ValidationMiddleware.validate(addMemberValidation),
  teamController.addMember.bind(teamController)
);
router.put(
  '/:id/members/:memberId',
  ValidationMiddleware.validate(updateMemberRoleValidation),
  teamController.updateMemberRole.bind(teamController)
);
router.delete('/:id/members/:memberId', teamController.removeMember.bind(teamController));

export default router;
