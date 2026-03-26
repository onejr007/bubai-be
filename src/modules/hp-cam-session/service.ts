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
    try {
      // Find session by pairing code
      const rows = await db.query<RowDataPacket[]>(
        `SELECT * FROM hp_cam_sessions 
        WHERE pairing_code = ? AND status = 'waiting' AND expires_at > NOW() 
        LIMIT 1`,
        [input.pairingCode]
      );

      if (rows.length === 0) {
        throw new AppError(404, 'Invalid pairing code or session expired');
      }

      const sessionData = rows[0];
      const sessionId = sessionData.session_id;
      const pairedAt = new Date();

      // Update session to paired
      await db.query(
        `UPDATE hp_cam_sessions 
        SET status = 'paired', has_viewer = TRUE, viewer_device_id = ?, paired_at = ?, last_activity = ? 
        WHERE session_id = ?`,
        [input.deviceId, pairedAt, pairedAt, sessionId]
      );

      const updated: HpCamSession = {
        sessionId,
        pairingCode: sessionData.pairing_code,
        deviceId: sessionData.device_id,
        status: 'paired',
        hasViewer: true,
        viewerDeviceId: input.deviceId,
        createdAt: sessionData.created_at,
        expiresAt: sessionData.expires_at,
        pairedAt: pairedAt.toISOString(),
        lastActivity: pairedAt.toISOString(),
      };

      logger.info(`🔗 Session paired: ${sessionId}`);
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
