import { db } from '@/core/database';
import { AppError } from '@/core/middleware/errorHandler';
import { logger } from '@/core/logger';
import { v4 as uuidv4 } from 'uuid';
import { HpCamSession, WebRTCSignal, CreateSessionInput, JoinSessionInput, SendSignalInput } from './types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

class HpCamSessionService {
  private SESSION_TTL = 300; // 5 minutes in seconds

  private generatePairingCode(): string {
    // Generate 6-digit pairing code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createSession(input: CreateSessionInput): Promise<HpCamSession> {
    const sessionId = uuidv4();
    const pairingCode = this.generatePairingCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_TTL * 1000);

    const session: HpCamSession = {
      sessionId,
      pairingCode,
      deviceId: input.deviceId,
      status: 'waiting',
      hasViewer: false,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastActivity: now.toISOString(),
    };

    try {
      await db.query(
        `INSERT INTO hp_cam_sessions 
        (session_id, pairing_code, device_id, status, has_viewer, created_at, expires_at, last_activity) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          pairingCode,
          input.deviceId,
          'waiting',
          false,
          now,
          expiresAt,
          now,
        ]
      );

      logger.info(`📱 Session created (MySQL): ${sessionId} with pairing code: ${pairingCode}`);
      return session;
    } catch (error: any) {
      logger.error('Failed to create session in MySQL:', error);
      throw new AppError(500, `Failed to create session: ${error.message}`);
    }
  }

  async joinSession(input: JoinSessionInput): Promise<HpCamSession> {
    let { sessionId, pairingCode, deviceId } = input;
    
    // BACKWARDS COMPATIBILITY: If phone sends UUID in pairingCode field (due to caching old code)
    // detect it and swap it to sessionId. UUID format: 8-4-4-4-12 hex chars.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!sessionId && pairingCode && uuidRegex.test(pairingCode)) {
      logger.info(`🔄 Backwards Compatibility Triggered: UUID detected in pairingCode field. Swapping to sessionId.`);
      sessionId = pairingCode;
      pairingCode = undefined;
    }

    logger.info(`🔗 Attempting to join session: sessionId=${sessionId || 'null'}, pairingCode=${pairingCode || 'null'}, deviceId=${deviceId}`);

    try {
      // 1. First, try to find an active session by sessionId or pairingCode
      let query = `SELECT * FROM hp_cam_sessions WHERE expires_at > NOW()`;
      const params: any[] = [];

      if (sessionId) {
        query += ` AND session_id = ?`;
        params.push(sessionId);
      } else if (pairingCode) {
        query += ` AND pairing_code = ?`;
        params.push(pairingCode);
      } else {
        throw new AppError(400, 'Either sessionId or pairingCode is required');
      }

      const rows = await db.query<RowDataPacket[]>(query, params);

      if (rows.length === 0) {
        logger.warn(`❌ Session not found or expired: sessionId=${sessionId}, pairingCode=${pairingCode}`);
        throw new AppError(404, sessionId ? 'Session not found or expired' : 'Invalid pairing code or session expired');
      }

      const sessionData = rows[0];
      const actualSessionId = sessionData.session_id;

      // 2. Check if already paired by the SAME device (Idempotency)
      if (sessionData.status === 'paired' && sessionData.viewer_device_id === deviceId) {
        logger.info(`✅ Session already paired with the same device: ${actualSessionId}`);
        return {
          sessionId: actualSessionId,
          pairingCode: sessionData.pairing_code,
          deviceId: sessionData.device_id,
          status: 'paired',
          hasViewer: true,
          viewerDeviceId: deviceId,
          createdAt: sessionData.created_at,
          expiresAt: sessionData.expires_at,
          pairedAt: sessionData.paired_at,
          lastActivity: new Date().toISOString(),
        };
      }

      // 3. If it's already paired by DIFFERENT device or ended, throw error
      if (sessionData.status !== 'waiting') {
        logger.warn(`❌ Session already in use or ended: ${actualSessionId}, status=${sessionData.status}`);
        throw new AppError(400, `Session is already ${sessionData.status}`);
      }

      // 4. Update session to paired
      const pairedAt = new Date();
      await db.query(
        `UPDATE hp_cam_sessions 
        SET status = 'paired', has_viewer = TRUE, viewer_device_id = ?, paired_at = ?, last_activity = ? 
        WHERE session_id = ?`,
        [deviceId, pairedAt, pairedAt, actualSessionId]
      );

      const updated: HpCamSession = {
        sessionId: actualSessionId,
        pairingCode: sessionData.pairing_code,
        deviceId: sessionData.device_id,
        status: 'paired',
        hasViewer: true,
        viewerDeviceId: deviceId,
        createdAt: sessionData.created_at,
        expiresAt: sessionData.expires_at,
        pairedAt: pairedAt.toISOString(),
        lastActivity: pairedAt.toISOString(),
      };

      logger.info(`🔗 Session successfully paired: ${actualSessionId}`);
      return updated;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to join session:', error);
      throw new AppError(500, `Failed to join session: ${error.message}`);
    }
  }

  async getSessionStatus(sessionId: string): Promise<HpCamSession> {
    try {
      const rows = await db.query<RowDataPacket[]>(
        `SELECT * FROM hp_cam_sessions WHERE session_id = ? AND expires_at > NOW()`,
        [sessionId]
      );

      if (rows.length === 0) {
        throw new AppError(404, 'Session not found or expired');
      }

      const session = rows[0];

      // Update last activity
      await db.query(
        `UPDATE hp_cam_sessions SET last_activity = NOW() WHERE session_id = ?`,
        [sessionId]
      );

      return {
        sessionId: session.session_id,
        pairingCode: session.pairing_code,
        deviceId: session.device_id,
        status: session.status,
        hasViewer: session.has_viewer,
        viewerDeviceId: session.viewer_device_id,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        pairedAt: session.paired_at,
        lastActivity: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get session status:', error);
      throw new AppError(500, `Failed to get session status: ${error.message}`);
    }
  }

  async sendSignal(input: SendSignalInput): Promise<void> {
    const signalId = uuidv4();
    const signal: WebRTCSignal = {
      id: signalId,
      sessionId: input.sessionId,
      type: input.type as any,
      from: input.from as any,
      to: input.from === 'mobile' ? 'viewer' : 'mobile',
      data: input.data,
      timestamp: new Date().toISOString(),
      delivered: false,
    };

    logger.info(`📡 SIGNAL: session=${input.sessionId}, from=${input.from}, type=${input.type}`);

    try {
      await db.query(
        `INSERT INTO hp_cam_signals 
        (id, session_id, type, from_device, to_device, data, timestamp, delivered) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          signalId,
          signal.sessionId,
          signal.type,
          signal.from,
          signal.to,
          JSON.stringify(signal.data),
          new Date(),
          false,
        ]
      );

      // Update session last activity
      await db.query(
        `UPDATE hp_cam_sessions SET last_activity = NOW() WHERE session_id = ?`,
        [input.sessionId]
      );
    } catch (error: any) {
      logger.error('Failed to send signal:', error);
      throw new AppError(500, `Failed to send signal: ${error.message}`);
    }
  }

  async getSignals(sessionId: string, forDevice: 'mobile' | 'viewer', since?: Date): Promise<WebRTCSignal[]> {
    try {
      let query = `
        SELECT * FROM hp_cam_signals 
        WHERE session_id = ? AND to_device = ? AND delivered = FALSE
      `;
      const params: any[] = [sessionId, forDevice];

      if (since) {
        query += ` AND timestamp > ?`;
        params.push(since);
      }

      query += ` ORDER BY timestamp ASC`;

      const rows = await db.query<RowDataPacket[]>(query, params);

      const signals: WebRTCSignal[] = rows.map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        type: row.type,
        from: row.from_device,
        to: row.to_device,
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        timestamp: row.timestamp,
        delivered: row.delivered,
      }));

      // Mark signals as delivered
      if (signals.length > 0) {
        const signalIds = signals.map((s) => s.id);
        await db.query(
          `UPDATE hp_cam_signals SET delivered = TRUE WHERE id IN (${signalIds.map(() => '?').join(',')})`,
          signalIds
        );
      }

      return signals;
    } catch (error: any) {
      logger.error('Failed to get signals:', error);
      throw new AppError(500, `Failed to get signals: ${error.message}`);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      const result = await db.query<ResultSetHeader>(
        `UPDATE hp_cam_sessions SET status = 'ended', last_activity = NOW() WHERE session_id = ?`,
        [sessionId]
      );

      if (result.affectedRows === 0) {
        throw new AppError(404, 'Session not found');
      }

      logger.info(`🔚 Session ended: ${sessionId}`);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to end session:', error);
      throw new AppError(500, `Failed to end session: ${error.message}`);
    }
  }

  // Cleanup expired sessions (can be called by cron job)
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await db.query<ResultSetHeader>(
        `DELETE FROM hp_cam_sessions WHERE expires_at < NOW()`
      );

      return result.affectedRows || 0;
    } catch (error: any) {
      logger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  // Get storage stats
  getStats() {
    return {
      storage: 'mysql',
      connected: db.isReady(),
      database: 'MySQL Railway',
    };
  }
}

export const hpCamSessionService = new HpCamSessionService();
