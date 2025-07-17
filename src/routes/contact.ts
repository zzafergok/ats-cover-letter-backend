import { Router } from 'express';

import { ContactController } from '../controllers/contact.controller';

import { requireAdmin, authenticateToken } from '../middleware/auth';
import { validate, contactMessageSchema } from '../middleware/validation';

const router = Router();
const contactController = new ContactController();

/**
 * @swagger
 * /contact/send:
 *   post:
 *     summary: Send contact or support message
 *     description: Sends a contact or support message with daily rate limiting (3 messages per IP). No authentication required.
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CONTACT, SUPPORT]
 *                 example: CONTACT
 *                 description: Message type - CONTACT for general inquiries, SUPPORT for technical support
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Ahmet Yılmaz"
 *                 description: Full name of the sender
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 example: "ahmet@example.com"
 *                 description: Email address for reply
 *               subject:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: "Proje hakkında soru"
 *                 description: Subject line of the message
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *                 example: "Merhaba, projeniz hakkında detaylı bilgi almak istiyorum..."
 *                 description: Detailed message content
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "İletişim mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidData:
 *                 summary: Invalid form data
 *                 value:
 *                   success: false
 *                   error: "VALID_001: Giriş doğrulama hatası - Ad soyad en az 2 karakter olmalıdır"
 *               invalidEmail:
 *                 summary: Invalid email format
 *                 value:
 *                   success: false
 *                   error: "VALID_001: Giriş doğrulama hatası - Geçerli bir email adresi giriniz"
 *       429:
 *         description: Daily rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "CONTACT_001: Günlük mesaj gönderme limitine ulaştınız (3/3)"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               emailError:
 *                 summary: Email sending failed
 *                 value:
 *                   success: false
 *                   error: "CONTACT_002: Email gönderimi başarısız - Lütfen daha sonra tekrar deneyin"
 *               systemError:
 *                 summary: General system error
 *                 value:
 *                   success: false
 *                   error: "CONTACT_003: Sistem hatası - Mesaj gönderilemedi"
 */
// PUBLIC ENDPOINT - Token gerektirmez
router.post(
  '/send',
  validate(contactMessageSchema),
  contactController.sendMessage
);

/**
 * @swagger
 * /contact/messages:
 *   get:
 *     summary: Get contact messages (Admin only)
 *     description: Retrieves all contact and support messages with pagination. Admin authentication required.
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of messages per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                         messages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "clxxxxx"
 *                               type:
 *                                 type: string
 *                                 enum: [CONTACT, SUPPORT]
 *                                 example: "CONTACT"
 *                               name:
 *                                 type: string
 *                                 example: "Ahmet Yılmaz"
 *                               email:
 *                                 type: string
 *                                 example: "ahmet@example.com"
 *                               subject:
 *                                 type: string
 *                                 example: "Proje hakkında soru"
 *                               message:
 *                                 type: string
 *                                 example: "Merhaba, projeniz hakkında..."
 *                               status:
 *                                 type: string
 *                                 enum: [PENDING, SENT, FAILED]
 *                                 example: "SENT"
 *                               ipAddress:
 *                                 type: string
 *                                 example: "192.168.1.1"
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2025-01-10T14:30:00Z"
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               example: 150
 *                             page:
 *                               type: integer
 *                               example: 1
 *                             limit:
 *                               type: integer
 *                               example: 20
 *                             totalPages:
 *                               type: integer
 *                               example: 8
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "AUTH_M006: Yetkisiz erişim - Bu işlem için admin yetkisi gerekli"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "CONTACT_004: Sistem hatası - Mesajlar yüklenemedi"
 */
// ADMIN ONLY ENDPOINT - Token gerektirir
router.get(
  '/messages',
  authenticateToken,
  requireAdmin,
  contactController.getMessages
);

/**
 * @swagger
 * /contact/limit:
 *   get:
 *     summary: Check daily message limit
 *     description: Returns remaining message count and reset time for the current IP address based on Turkey timezone (UTC+3)
 *     tags: [Contact]
 *     responses:
 *       200:
 *         description: Limit information retrieved successfully
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
 *                         remainingMessages:
 *                           type: integer
 *                           example: 2
 *                           description: Number of messages remaining for today
 *                         dailyLimit:
 *                           type: integer
 *                           example: 3
 *                           description: Total daily message limit
 *                         nextResetTime:
 *                           type: string
 *                           example: "11.01.2025 00:00"
 *                           description: When the limit will reset (Turkey time)
 */
router.get('/limit', contactController.checkLimit);

export { router as contactRoutes };
