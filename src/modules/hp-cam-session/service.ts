import { db } from '@/core/database';
import { AppError } from '@/core/middleware/errorHandler';
import { logger } from '@/core/logger';
import { v4 as uuidv4 } from 'uuid';
import { HpCamSession, WebRTCSignal, CreateSessionInput, JoinSessionInput, SendSignalInput } from './types';
import { inMemoryStore } from './inMemoryStore';

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
      if (this.useCouchbase()) {
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
        } catch (dbError: any) {
          // Fallback to in-memory if Couchbase fails
          logger.warn(`⚠️ Couchbase insert failed, using in-memory: ${dbError.message}`);
          inMemoryStore.saveSession(session);
          logger.info(`📱 Session created (Memory fallback): ${sessionId} with pairing code: ${pairingCode}`);
        }
      } else {
        inMemoryStore.saveSession(session);
        logger.info(`📱 Session created (Memory): ${sessionId} with pairing code: ${pairingCode}`);
      }
      
      return session;
    } catch (error: any) {
      logger.error('Failed to create session:', error);
      throw new AppError(500, 'Failed to create session');
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
          error.name === 'TimeoutError' ||
          error.context?.retry_reasons?.includes('key_value_collection_outdated') ||
          error.message?.includes('collection_outdated');
        
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = 100 * Math.pow(2, attempt - 1);
        logger.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  async joinSession(input: JoinSessionInput): Promise<HpCamSession> {
    try {
      let sessionId: string;
      let existing: any;

      if (this.useCouchbase()) {
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
        sessionId = sessionData.id;

        // Update session to paired
        const collection = this.getSessionCollection();
        existing = await this.retryOperation(async () => {
          return await collection.get(sessionId, { timeout: 10000 });
        }, 3, 'get session for pairing');
      } else {
        // Use in-memory store
        const session = inMemoryStore.getSessionByPairingCode(input.pairingCode);
        if (!session || session.status !== 'waiting') {
          throw new AppError(404, 'Invalid pairing code or session expired');
        }
        sessionId = session.sessionId;
        existing = { content: session };
      }
      
      const updated: HpCamSession = {
        ...existing.content,
        status: 'paired',
        hasViewer: true,
        viewerDeviceId: input.deviceId,
        pairedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      if (this.useCouchbase()) {
        const collection = this.getSessionCollection();
        await this.retryOperation(async () => {
          await collection.replace(sessionId, updated, {
            expiry: this.SESSION_TTL,
            timeout: 10000,
          });
        }, 3, 'replace session');
      } else {
        inMemoryStore.updateSession(sessionId, updated);
      }

      logger.info(`🔗 Session paired: ${sessionId}`);
      return updated;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to join session:', error);
      throw new AppError(500, 'Failed to join session');
    }
  }

  async getSessionStatus(sessionId: string): Promise<HpCamSession> {
    try {
      let session: HpCamSession;

      if (this.useCouchbase()) {
        const collection = this.getSessionCollection();
        const result = await this.retryOperation(async () => {
          return await collection.get(sessionId, { timeout: 10000 });
        }, 3, 'get session');
        session = result.content;
        
        // Update last activity
        session.lastActivity = new Date().toISOString();
        
        await this.retryOperation(async () => {
          await collection.replace(sessionId, session, {
            expiry: this.SESSION_TTL,
            timeout: 10000,
          });
        }, 3, 'update session activity');
      } else {
        const stored = inMemoryStore.getSession(sessionId);
        if (!stored) {
          throw new AppError(404, 'Session not found or expired');
        }
        session = stored;
        
        // Update last activity
        session.lastActivity = new Date().toISOString();
        inMemoryStore.updateSession(sessionId, session);
      }

      return session;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
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
      if (this.useCouchbase()) {
        const collection = this.getSignalCollection();
        await this.retryOperation(async () => {
          await collection.insert(signalId, signal, {
            expiry: this.SIGNAL_TTL,
            timeout: 10000,
          });
        }, 3, 'insert signal');
      } else {
        inMemoryStore.saveSignal(signal);
      }

      // Update session last activity
      await this.updateSessionActivity(input.sessionId);
    } catch (error: any) {
      logger.error('Failed to send signal:', error);
      throw new AppError(500, 'Failed to send signal');
    }
  }

  async getSignals(sessionId: string, forDevice: 'mobile' | 'viewer', since?: Date): Promise<WebRTCSignal[]> {
    try {
      let signals: WebRTCSignal[];

      if (this.useCouchbase()) {
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
        signals = result.rows;
      } else {
        signals = inMemoryStore.getSignals(sessionId, forDevice, since);
      }

      // Mark signals as delivered
      await this.markSignalsDelivered(signals.map(s => s.id));

      return signals;
    } catch (error: any) {
      // If collection doesn't exist, return empty array
      if (error.message?.includes('not found')) {
        return [];
      }
      logger.error('Failed to get signals:', error);
      return [];
    }
  }

  private async markSignalsDelivered(signalIds: string[]): Promise<void> {
    if (signalIds.length === 0) return;

    try {
      if (this.useCouchbase()) {
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
      } else {
        signalIds.forEach(id => inMemoryStore.markSignalDelivered(id));
      }
    } catch (error) {
      // Ignore errors in marking delivered
    }
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      if (this.useCouchbase()) {
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
      } else {
        const session = inMemoryStore.getSession(sessionId);
        if (session) {
          session.lastActivity = new Date().toISOString();
          inMemoryStore.updateSession(sessionId, session);
        }
      }
    } catch (error) {
      // Ignore if session expired
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      if (this.useCouchbase()) {
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
      } else {
        const session = inMemoryStore.getSession(sessionId);
        if (!session) {
          throw new AppError(404, 'Session not found');
        }
        
        session.status = 'ended';
        session.lastActivity = new Date().toISOString();
        inMemoryStore.updateSession(sessionId, session);
      }
      
      logger.info(`🔚 Session ended: ${sessionId}`);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'Session not found');
      }
      throw error;
    }
  }

  // Cleanup expired sessions (can be called by cron job)
  async cleanupExpiredSessions(): Promise<number> {
    try {
      if (this.useCouchbase()) {
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
      } else {
        // In-memory store has auto-cleanup
        return 0;
      }
    } catch (error) {
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
