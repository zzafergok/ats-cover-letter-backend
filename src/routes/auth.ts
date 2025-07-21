import { Router } from 'express';

import {
  validate,
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  updateUserProfileSchema,
  resendEmailVerificationSchema,
} from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);
router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  authController.verifyEmail
);
router.post(
  '/resend-verification',
  authLimiter,
  validate(resendEmailVerificationSchema),
  authController.resendEmailVerification
);
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);
router.post('/logout', authenticateToken, authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAll);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put(
  '/profile',
  authenticateToken,
  validate(updateUserProfileSchema),
  authController.updateUserProfile
);
router.put(
  '/change-password',
  authenticateToken,
  validate(changePasswordSchema),
  authController.changePassword
);
router.get('/sessions', authenticateToken, authController.getSessions);

export default router;
