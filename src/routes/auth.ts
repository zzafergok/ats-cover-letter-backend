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

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           example: SecurePass123!
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         password:
 *           type: string
 *           minLength: 8
 *           pattern: '^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$'
 *           example: SecurePass123!
 *           description: Must contain at least one letter and one number
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: John Doe
 *         role:
 *           type: string
 *           enum: ['ADMIN', 'DEVELOPER', 'PRODUCT_OWNER', 'PROJECT_ANALYST']
 *           example: STANDART
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: clxxxxx
 *             email:
 *               type: string
 *               example: john.doe@example.com
 *             name:
 *               type: string
 *               example: John Doe
 *             role:
 *               type: string
 *               example: STANDART
 *             emailVerified:
 *               type: boolean
 *               example: true
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         expiresIn:
 *           type: integer
 *           example: 3600
 *           description: Token expiration time in seconds
 *
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *     VerifyEmailRequest:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *           description: Password reset token received via email
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           pattern: '^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$'
 *           example: NewPass123!
 *           description: New password (min 8 chars, at least one letter and number)
 *         confirmPassword:
 *           type: string
 *           example: NewPass123!
 *           description: Password confirmation (must match newPassword)
 *
 *     UpdateUserProfileRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           example: john.doe@example.com
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *         - confirmPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           example: OldPass123!
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           pattern: '^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$'
 *           example: NewPass123!
 *         confirmPassword:
 *           type: string
 *           example: NewPass123!
 *
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: clxxxxx
 *         email:
 *           type: string
 *           example: john.doe@example.com
 *         name:
 *           type: string
 *           example: John Doe
 *         role:
 *           type: string
 *           example: STANDART
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-01-10T10:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-01-10T15:30:00Z
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user and returns access and refresh tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidEmail:
 *                 summary: Invalid email
 *                 value:
 *                   success: false
 *                   error: "AUTH_001: Kullanıcı girişi başarısız - Email adresi bulunamadı"
 *               invalidPassword:
 *                 summary: Invalid password
 *                 value:
 *                   success: false
 *                   error: "AUTH_002: Kullanıcı girişi başarısız - Şifre hatalı"
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_025: Giriş engellendi - Email adresinizi doğrulamanız gerekiyor"
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
 *     description: Creates a new user account and sends email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Registration successful, email verification sent
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Hesap oluşturuldu, email adresinizi doğrulayın
 *                         email:
 *                           type: string
 *                           example: john.doe@example.com
 *                         emailSent:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               duplicateEmail:
 *                 summary: Email already exists
 *                 value:
 *                   success: false
 *                   error: "AUTH_005: Bu email adresi zaten kullanımda"
 *               roleConflict:
 *                 summary: Role already taken
 *                 value:
 *                   success: false
 *                   error: "AUTH_006: ADMIN rolü için kullanıcı zaten mevcut"
 *               invalidFormat:
 *                 summary: Invalid email or password format
 *                 value:
 *                   success: false
 *                   error: "AUTH_025: Email adresi ve parolanızı kontrol ediniz"
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     description: Verifies user email address using verification token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidToken:
 *                 summary: Invalid verification token
 *                 value:
 *                   success: false
 *                   error: "AUTH_018: Geçersiz email doğrulama token"
 *               alreadyVerified:
 *                 summary: Email already verified
 *                 value:
 *                   success: false
 *                   error: "AUTH_019: Email adresi zaten doğrulanmış"
 *               tokenExpired:
 *                 summary: Verification token expired
 *                 value:
 *                   success: false
 *                   error: "AUTH_020: Email doğrulama süresi dolmuş"
 */
router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  authController.verifyEmail
);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     description: Sends a new email verification link to the user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Verification email sent (always returns success for security)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Email doğrulama bağlantısı yeniden gönderildi
 *       400:
 *         description: Email already verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_023: Email adresi zaten doğrulanmış"
 */
router.post(
  '/resend-verification',
  validate(resendEmailVerificationSchema),
  authController.resendEmailVerification
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generates new access and refresh tokens using refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_009: Token yenileme başarısız - Token doğrulama hatası"
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logs out the current user session
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Başarıyla çıkış yapıldı
 */
router.post('/logout', validate(refreshTokenSchema), authController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     description: Logs out the user from all active sessions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Tüm cihazlardan çıkış yapıldı
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout-all', authenticateToken, authController.logoutAll);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Sends password reset email to registered user with validation and daily rate limiting
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Şifre sıfırlama bağlantısı email adresinize gönderildi
 *       400:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_034: Email adresi doğrulanmamış - Önce email doğrulaması yapmanız gerekiyor"
 *       404:
 *         description: Email address not found in system
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_033: Email adresi sistemde bulunamadı - Lütfen kayıtlı email adresinizi kontrol edin"
 *       429:
 *         description: Daily reset limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_037: Şifre sıfırlama günlük limitine ulaşıldı - 24 saat sonra tekrar deneyiniz"
 *       500:
 *         description: Internal server error
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: Resets user password using the token received via email with daily rate limiting
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Şifre başarıyla sıfırlandı
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidToken:
 *                 summary: Invalid reset token
 *                 value:
 *                   success: false
 *                   error: "AUTH_035: Geçersiz şifre sıfırlama token"
 *               expiredToken:
 *                 summary: Expired reset token
 *                 value:
 *                   success: false
 *                   error: "AUTH_036: Şifre sıfırlama süresi dolmuş"
 *       429:
 *         description: Daily reset limit reached
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_037: Şifre sıfırlama günlük limitine ulaşıldı"
 *       500:
 *         description: Internal server error
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieves the authenticated user's profile information
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_013: Kullanıcı bilgisi bulunamadı"
 */
router.get('/me', authenticateToken, authController.getCurrentUser);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_028: Bu email adresi başka bir kullanıcı tarafından kullanılmaktadır"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put(
  '/profile',
  authenticateToken,
  validate(updateUserProfileSchema),
  authController.updateUserProfile
);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Change password
 *     description: Changes the authenticated user's password
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Şifre başarıyla değiştirildi
 *       400:
 *         description: Invalid current password or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCurrentPassword:
 *                 summary: Current password is incorrect
 *                 value:
 *                   success: false
 *                   error: "AUTH_031: Mevcut şifre hatalı"
 *               passwordMismatch:
 *                 summary: New passwords don't match
 *                 value:
 *                   success: false
 *                   error: "VALID_001: Giriş doğrulama hatası - Yeni şifre ve şifre tekrarı eşleşmiyor"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put(
  '/change-password',
  authenticateToken,
  validate(changePasswordSchema),
  authController.changePassword
);

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Get user sessions
 *     description: Retrieves all active sessions for the authenticated user
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                       example: []
 *       401:
 *         description: Unauthorized
 */
router.get('/sessions', authenticateToken, authController.getSessions);

export { router as authRoutes };
