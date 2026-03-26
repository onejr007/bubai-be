import { Router } from 'express';
import { hpCamSessionController } from './controller';

const router = Router();

/**
 * @swagger
 * /api/v1/hp-cam-session/create:
 *   post:
 *     summary: Create new HP Camera session
 *     tags: [HP Camera Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *             properties:
 *               deviceId:
 *                 type: string
 *                 example: mobile-device-123
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     pairingCode:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 */
router.post('/create', hpCamSessionController.createSession);

/**
 * @swagger
 * /api/v1/hp-cam-session/join:
 *   post:
 *     summary: Join existing session with pairing code
 *     tags: [HP Camera Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pairingCode
 *               - deviceId
 *             properties:
 *               pairingCode:
 *                 type: string
 *                 example: "123456"
 *               deviceId:
 *                 type: string
 *                 example: viewer-device-456
 *     responses:
 *       200:
 *         description: Successfully joined session
 *       404:
 *         description: Invalid pairing code or session expired
 */
router.post('/join', hpCamSessionController.joinSession);

/**
 * @swagger
 * /api/v1/hp-cam-session/{sessionId}/status:
 *   get:
 *     summary: Get session status
 *     tags: [HP Camera Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session status
 *       404:
 *         description: Session not found or expired
 */
router.get('/:sessionId/status', hpCamSessionController.getSessionStatus);

/**
 * @swagger
 * /api/v1/hp-cam-session/signal:
 *   post:
 *     summary: Send WebRTC signal
 *     tags: [HP Camera Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - type
 *               - from
 *               - data
 *             properties:
 *               sessionId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [offer, answer, ice-candidate]
 *               from:
 *                 type: string
 *                 enum: [mobile, viewer]
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Signal sent successfully
 */
router.post('/signal', hpCamSessionController.sendSignal);

/**
 * @swagger
 * /api/v1/hp-cam-session/signal/{sessionId}:
 *   get:
 *     summary: Get pending signals for device
 *     tags: [HP Camera Session]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: forDevice
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mobile, viewer]
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of pending signals
 */
router.get('/signal/:sessionId', hpCamSessionController.getSignals);

/**
 * @swagger
 * /api/v1/hp-cam-session/end:
 *   post:
 *     summary: End session
 *     tags: [HP Camera Session]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session ended successfully
 */
router.post('/end', hpCamSessionController.endSession);

/**
 * @swagger
 * /api/v1/hp-cam-session/stats:
 *   get:
 *     summary: Get session storage statistics
 *     tags: [HP Camera Session]
 *     responses:
 *       200:
 *         description: Storage statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     storage:
 *                       type: string
 *                       enum: [couchbase, memory]
 *                     sessions:
 *                       type: number
 *                     signals:
 *                       type: number
 *                     activeSessions:
 *                       type: number
 */
router.get('/stats', hpCamSessionController.getStats);

export default router;
