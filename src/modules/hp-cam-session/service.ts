import { db } from '@/core/database';
import { AppError } from '@/core/middleware/errorHandler';
import { logger } from '@/core/logger';
import { v4 as uuidv4 } from 'uuid';
import { HpCamSession, WebRTCSignal, CreateSessionInput, JoinSessionInput, SendSignalInput } from './types';

class HpCamSessionService {
  private sessionCollection = 'hp_cam_sessions';
  private signalCollection = 'hp_cam_signals';
  private SESSION_TTL = 300; // 5 minutes in seconds
  private SIGNAL_TTL = 60; // 1 minute in seconds

  private useCouchbase(): boolean {
    return db.isReady();
  }

  private getSessionCollection() {
    if (!db.isReady()) {
      throw new AppError(503, 'Database not connected');
    }
    return db.getCollection('_default', this.sessionCollection);
  }

  private getSignalCollection() {
    if (!db.isReady()) {
      throw new AppError(503, 'Database not connected');
    }
    return db.getCollection('_default', this.signalCollection);
  }

  private generatePairingCode(): string {
    // Generate 6-digit pairing code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createSession(input: CreateSessionInput): Promise<HpCamSession> {
    // Ensure Couchbase is connected
    if (!this.useCouchbase()) {
      throw new AppError(503, 'Database not connected. Couchbase is required.');
    }

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
      // Retry logic for transient errors
      await this.retryOperation(async () => {
        await collection.insert(sessionId, session, {
          expiry: this.SESSION_TTL,
          timeout: 10000, // 10 second timeout
        });
      }, 3, 'insert session');
      
      logger.info(`📱 Session created (Couchbase): ${sessionId} with pairing code: ${pairingCode}`);
      return session;
    } catch (error: any) {
      logger.error('Failed to create session in Couchbase:', error);
      throw new AppError(500, `Failed to create session: ${error.message}`);
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        const isRetryable = 
          error.name === 'AmbiguousTimeoutError' ||
          error.name === 'UnambiguousTimeoutError' ||
          error.name === 'TimeoutError' ||
          error.context?.retry_reasons?.includes('key_value_collection_outdated') ||
          error.cause?.retry_reasons?.includes('key_value_collection_outdated') ||
          error.message?.includes('collection_outdated') ||
          error.message?.includes('timeout');
        
        if (!isRetryable || attempt === maxRetries) {
          // If all retries failed due to collection issues, throw a more helpful error
          if (error.context?.retry_reasons?.includes('key_value_collection_outdated') ||
              error.cause?.retry_reasons?.includes('key_value_collection_outdated')) {
            logger.error(`❌ Collection metadata not ready after ${maxRetries} attempts. This may indicate collection doesn't exist.`);
          }
          throw error;
        }
        
        // Exponential backoff: 200ms, 500ms, 1000ms (increased delays)
        const delay = 200 * Math.pow(2, attempt - 1);
        logger.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  async joinSession(input: JoinSessionInput): Promise<HpCamSession> {
    // Ensure Couchbase is connected
    if (!this.useCouchbase()) {
      throw new AppError(503, 'Database not connected. Couchbase is required.');
    }

    try {
      // Find session by pairing code in Couchbase
      const cluster = db.getCluster();
      const bucketName = db.getBucket().name;
      
      const query = `
        SELECT META().id, sessions.*
        FROM \`${bucketName}\`._default.${this.sessionCollection} AS sessions
        WHERE sessions.pairingCode = $pairingCode
        AND sessions.status = 'waiting'
        LIMIT 1
      `;

      const result = await this.retryOperation(async () => {
        return await cluster.query(query, {
          parameters: { pairingCode: input.pairingCode },
          timeout: 10000,
        });
      }, 3, 'query session by pairing code');

      if (result.rows.length === 0) {
        throw new AppError(404, 'Invalid pairing code or session expired');
      }

      const sessionData = result.rows[0];
      const sessionId = sessionData.id;

      // Update session to paired
      const collection = this.getSessionCollection();
      const existing = await this.retryOperation(async () => {
        return await collection.get(sessionId, { timeout: 10000 });
      }, 3, 'get session for pairing');
      
      const updated: HpCamSession = {
        ...existing.content,
        status: 'paired',
        hasViewer: true,
        viewerDeviceId: input.deviceId,
        pairedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      await this.retryOperation(async () => {
        await collection.replace(sessionId, updated, {
          expiry: this.SESSION_TTL,
          timeout: 10000,
        });
      }, 3, 'replace session');

      logger.info(`🔗 Session paired: ${sessionId}`);
      return updated;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to join session:', error);
      throw new AppError(500, `Failed to join session: ${error.message}`);
    }
  }

  async getSessionStatus(sessionId: string): Promise<HpCamSession> {
    // Ensure Couchbase is connected
    if (!this.useCouchbase()) {
      throw new AppError(503, 'Database not connected. Couchbase is required.');
    }

    try {
      const collection = this.getSessionCollection();
      const result = await this.retryOperation(async () => {
        return await collection.get(sessionId, { timeout: 10000 });
      }, 3, 'get session');
      
      const session: HpCamSession = result.content;
      
      // Update last activity
      session.lastActivity = new Date().toISOString();
      
      await this.retryOperation(async () => {
        await collection.replace(sessionId, session, {
          expiry: this.SESSION_TTL,
          timeout: 10000,
        });
      }, 3, 'update session activity');

      return session;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'Session not found or expired');
      }
      logger.error('Failed to get session status:', error);
      throw new AppError(500, `Failed to get session status: ${error.message}`);
    }
  }

  async sendSignal(input: SendSignalInput): Promise<void> {
    // Ensure Couchbase is connected
    if (!this.useCouchbase()) {
      throw new AppError(503, 'Database not connected. Couchbase is required.');
    }

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
      await this.retryOperation(async () => {
        await collection.insert(signalId, signal, {
          expiry: this.SIGNAL_TTL,
          timeout: 10000,
        });
      }, 3, 'insert signal');

      // Update session last activity
      await this.updateSessionActivity(input.sessionId);
    } catch (error: any) {
      logger.error('Failed to send signal:', error);
      throw new AppError(500, `Failed to send signal: ${error.message}`);
    }
  }

  async getSignals(sessionId: string, forDevice: 'mobile' | 'viewer', since?: Date): Promise<WebRTCSignal[]> {
    // Ensure Couchbase is connected
    if (!this.useCouchbase()) {
      throw new AppError(503, 'Database not connected. Couchbase is required.');
    }

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
      const signals: WebRTCSignal[] = result.rows;

      // Mark signals as delivered
      await this.markSignalsDelivered(signals.map(s => s.id));

      return signals;
    } catch (error: any) {
      // If collection doesn't exist, return empty array
      if (error.message?.includes('not found')) {
        return [];
      }
      logger.error('Failed to get signals:', error);
      throw new AppError(500, `Failed to get signals: ${error.message}`);
    }
  }

  private async markSignalsDelivered(signalIds: string[]): Promise<void> {
    if (signalIds.length === 0) return;

    try {
      const collection = this.getSignalCollection();
      
      for (const signalId of signalIds) {
        try {
          const result = await collection.get(signalId, { timeout: 5000 });
          const signal = result.content;
          signal.delivered = true;
          await collection.replace(signalId, signal, {
            expiry: this.SIGNAL_TTL,
            timeout: 5000,
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
      const result = await this.retryOperation(async () => {
        return await collection.get(sessionId, { timeout: 10000 });
      }, 2, 'get session for activity update');
      const session = result.content;
      session.lastActivity = new Date().toISOString();
      await this.retryOperation(async () => {
        await collection.replace(sessionId, session, {
          expiry: this.SESSION_TTL,
          timeout: 10000,
        });
      }, 2, 'update session activity timestamp');
    } catch (error) {
      // Ignore if session expired
    }
  }

  async endSession(sessionId: string): Promise<void> {
    // Ensure Couchbase is connected
    if (!this.useCouchbase()) {
      throw new AppError(503, 'Database not connected. Couchbase is required.');
    }

    try {
      const collection = this.getSessionCollection();
      const result = await this.retryOperation(async () => {
        return await collection.get(sessionId, { timeout: 10000 });
      }, 3, 'get session for ending');
      const session: HpCamSession = result.content;
      
      session.status = 'ended';
      session.lastActivity = new Date().toISOString();
      
      await this.retryOperation(async () => {
        await collection.replace(sessionId, session, {
          expiry: 60, // Keep for 1 minute after ending
          timeout: 10000,
        });
      }, 3, 'end session');
      
      logger.info(`🔚 Session ended: ${sessionId}`);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'Session not found');
      }
      logger.error('Failed to end session:', error);
      throw new AppError(500, `Failed to end session: ${error.message}`);
    }
  }

  // Cleanup expired sessions (can be called by cron job)
  async cleanupExpiredSessions(): Promise<number> {
    // Ensure Couchbase is connected
    if (!this.useCouchbase()) {
      throw new AppError(503, 'Database not connected. Couchbase is required.');
    }

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
        timeout: 30000,
      });

      return result.meta.metrics?.mutationCount || 0;
    } catch (error: any) {
      logger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }

  // Get storage stats
  getStats() {
    return { 
      storage: this.useCouchbase() ? 'couchbase' : 'memory', 
      connected: db.isReady(),
      bucket: db.isReady() ? db.getBucket().name : 'N/A'
    };
  }
}

export const hpCamSessionService = new HpCamSessionService();
