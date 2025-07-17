import { Router } from 'express';
import {
  validate,
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resendEmailVerificationSchema,
  changePasswordSchema,
  updateUserProfileSchema,
  resetPasswordSchema,
} from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  authController.verifyEmail
);
router.post(
  '/resend-verification',
  validate(resendEmailVerificationSchema),
  authController.resendEmailVerification
);
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);
router.post('/logout', validate(refreshTokenSchema), authController.logout);
router.post('/logout-all', authenticateToken, authController.logoutAll);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
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
