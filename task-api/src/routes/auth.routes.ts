import { Router } from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];

// Routes
router.post(
  '/register',
  ValidationMiddleware.validate(registerValidation),
  authController.register.bind(authController)
);

router.post(
  '/login',
  ValidationMiddleware.validate(loginValidation),
  authController.login.bind(authController)
);

router.post(
  '/refresh',
  ValidationMiddleware.validate(refreshTokenValidation),
  authController.refreshToken.bind(authController)
);

router.get(
  '/profile',
  AuthMiddleware.authenticate,
  authController.getProfile.bind(authController)
);

router.post(
  '/logout',
  AuthMiddleware.authenticate,
  authController.logout.bind(authController)
);

router.post(
  '/change-password',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validate(changePasswordValidation),
  authController.changePassword.bind(authController)
);

router.post(
  '/forgot-password',
  ValidationMiddleware.validate(forgotPasswordValidation),
  authController.forgotPassword.bind(authController)
);

router.post(
  '/reset-password',
  ValidationMiddleware.validate(resetPasswordValidation),
  authController.resetPassword.bind(authController)
);

export default router;
