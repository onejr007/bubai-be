import { db } from '@/core/database';
import { AppError } from '@/core/middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { HpCamSession, WebRTCSignal, CreateSessionInput, JoinSessionInput, SendSignalInput } from './types';

class HpCamSessionService {
  private sessionCollection = 'hp_cam_sessions';
  private signalCollection = 'hp_cam_signals';
  private SESSION_TTL = 300; // 5 minutes in seconds
  private SIGNAL_TTL = 60; // 1 minute in seconds

  private getSessionCollection() {
    return db.getCollection('_default', this.sessionCollection);
  }

  private getSignalCollection() {
    return db.getCollection('_default', this.signalCollection);
  }

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
      const collection = this.getSessionCollection();
      // Store with TTL (auto-delete after expiration)
      await collection.insert(sessionId, session, {
        expiry: this.SESSION_TTL,
      });

      return session;
    } catch (error: any) {
      throw new AppError(500, 'Failed to create session');
    }
  }

  async joinSession(input: JoinSessionInput): Promise<HpCamSession> {
    try {
      // Find session by pairing code
      const cluster = db.getCluster();
      const bucketName = db.getBucket().name;
      
      const query = `
        SELECT META().id, sessions.*
        FROM \`${bucketName}\`._default.${this.sessionCollection} AS sessions
        WHERE sessions.pairingCode = $pairingCode
        AND sessions.status = 'waiting'
        LIMIT 1
      `;

      const result = await cluster.query(query, {
        parameters: { pairingCode: input.pairingCode },
      });

      if (result.rows.length === 0) {
        throw new AppError(404, 'Invalid pairing code or session expired');
      }

      const sessionData = result.rows[0];
      const sessionId = sessionData.id;

      // Update session to paired
      const collection = this.getSessionCollection();
      const existing = await collection.get(sessionId);
      
      const updated: HpCamSession = {
        ...existing.content,
        status: 'paired',
        hasViewer: true,
        viewerDeviceId: input.deviceId,
        pairedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      await collection.replace(sessionId, updated, {
        expiry: this.SESSION_TTL,
      });

      return updated;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to join session');
    }
  }

  async getSessionStatus(sessionId: string): Promise<HpCamSession> {
    try {
      const collection = this.getSessionCollection();
      const result = await collection.get(sessionId);
      
      // Update last activity
      const session: HpCamSession = result.content;
      session.lastActivity = new Date().toISOString();
      
      await collection.replace(sessionId, session, {
        expiry: this.SESSION_TTL,
      });

      return session;
    } catch (error: any) {
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'Session not found or expired');
      }
      throw error;
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
      const collection = this.getSignalCollection();
      await collection.insert(signalId, signal, {
        expiry: this.SIGNAL_TTL,
      });

      // Update session last activity
      await this.updateSessionActivity(input.sessionId);
    } catch (error: any) {
      throw new AppError(500, 'Failed to send signal');
    }
  }

  async getSignals(sessionId: string, forDevice: 'mobile' | 'viewer', since?: Date): Promise<WebRTCSignal[]> {
    try {
      const cluster = db.getCluster();
      const bucketName = db.getBucket().name;
      
      let query = `
        SELECT signals.*
        FROM \`${bucketName}\`._default.${this.signalCollection} AS signals
        WHERE signals.sessionId = $sessionId
        AND signals.to = $forDevice
        AND signals.delivered = false
      `;

      const parameters: any = {
        sessionId,
        forDevice,
      };

      if (since) {
        query += ` AND signals.timestamp > $since`;
        parameters.since = since.toISOString();
      }

      query += ` ORDER BY signals.timestamp ASC`;

      const result = await cluster.query(query, { parameters });

      // Mark signals as delivered
      const signals: WebRTCSignal[] = result.rows;
      await this.markSignalsDelivered(signals.map(s => s.id));

      return signals;
    } catch (error: any) {
      // If collection doesn't exist, return empty array
      if (error.message?.includes('not found')) {
        return [];
      }
      throw error;
    }
  }

  private async markSignalsDelivered(signalIds: string[]): Promise<void> {
    if (signalIds.length === 0) return;

    try {
      const collection = this.getSignalCollection();
      
      for (const signalId of signalIds) {
        try {
          const result = await collection.get(signalId);
          const signal = result.content;
          signal.delivered = true;
          await collection.replace(signalId, signal, {
            expiry: this.SIGNAL_TTL,
          });
        } catch (error) {
          // Ignore if signal already expired
        }
      }
    } catch (error) {
      // Ignore errors in marking delivered
    }
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const collection = this.getSessionCollection();
      const result = await collection.get(sessionId);
      const session = result.content;
      session.lastActivity = new Date().toISOString();
      await collection.replace(sessionId, session, {
        expiry: this.SESSION_TTL,
      });
    } catch (error) {
      // Ignore if session expired
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      const collection = this.getSessionCollection();
      const result = await collection.get(sessionId);
      const session: HpCamSession = result.content;
      
      session.status = 'ended';
      session.lastActivity = new Date().toISOString();
      
      await collection.replace(sessionId, session, {
        expiry: 60, // Keep for 1 minute after ending
      });
    } catch (error: any) {
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'Session not found');
      }
      throw error;
    }
  }

  // Cleanup expired sessions (can be called by cron job)
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const cluster = db.getCluster();
      const bucketName = db.getBucket().name;
      const now = new Date().toISOString();
      
      const query = `
        DELETE FROM \`${bucketName}\`._default.${this.sessionCollection}
        WHERE expiresAt < $now
      `;

      const result = await cluster.query(query, {
        parameters: { now },
      });

      return result.meta.metrics?.mutationCount || 0;
    } catch (error) {
      return 0;
    }
  }
}

export const hpCamSessionService = new HpCamSessionService();
