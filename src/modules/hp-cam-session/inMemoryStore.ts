import { HpCamSession, WebRTCSignal } from './types';
import { logger } from '@/core/logger';

/**
 * In-memory store for HP Cam sessions when Couchbase is not available
 * This is a fallback solution for development/testing
 */
class InMemorySessionStore {
  private sessions: Map<string, HpCamSession> = new Map();
  private signals: Map<string, WebRTCSignal> = new Map();
  private pairingCodeIndex: Map<string, string> = new Map(); // pairingCode -> sessionId
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup job
    this.startCleanupJob();
    logger.info('📦 In-memory session store initialized');
  }

  // Session operations
  saveSession(session: HpCamSession): void {
    this.sessions.set(session.sessionId, session);
    this.pairingCodeIndex.set(session.pairingCode, session.sessionId);
  }

  getSession(sessionId: string): HpCamSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionByPairingCode(pairingCode: string): HpCamSession | undefined {
    const sessionId = this.pairingCodeIndex.get(pairingCode);
    return sessionId ? this.sessions.get(sessionId) : undefined;
  }

  updateSession(sessionId: string, updates: Partial<HpCamSession>): HpCamSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const updated = { ...session, ...updates };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  deleteSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.pairingCodeIndex.delete(session.pairingCode);
      this.sessions.delete(sessionId);
    }
  }

  // Signal operations
  saveSignal(signal: WebRTCSignal): void {
    this.signals.set(signal.id, signal);
  }

  getSignals(sessionId: string, forDevice: 'mobile' | 'viewer', since?: Date): WebRTCSignal[] {
    const signals: WebRTCSignal[] = [];
    
    for (const signal of this.signals.values()) {
      if (signal.sessionId === sessionId && signal.to === forDevice && !signal.delivered) {
        if (!since || new Date(signal.timestamp) > since) {
          signals.push(signal);
        }
      }
    }

    return signals.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  markSignalDelivered(signalId: string): void {
    const signal = this.signals.get(signalId);
    if (signal) {
      signal.delivered = true;
      this.signals.set(signalId, signal);
    }
  }

  deleteSignal(signalId: string): void {
    this.signals.delete(signalId);
  }

  // Cleanup expired sessions and signals
  private cleanup(): void {
    const now = new Date();
    let sessionsDeleted = 0;
    let signalsDeleted = 0;

    // Cleanup expired sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.deleteSession(sessionId);
        sessionsDeleted++;
      }
    }

    // Cleanup old signals (older than 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    for (const [signalId, signal] of this.signals.entries()) {
      if (new Date(signal.timestamp) < fiveMinutesAgo) {
        this.deleteSignal(signalId);
        signalsDeleted++;
      }
    }

    if (sessionsDeleted > 0 || signalsDeleted > 0) {
      logger.info(`🧹 Cleanup: ${sessionsDeleted} sessions, ${signalsDeleted} signals deleted`);
    }
  }

  private startCleanupJob(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  stopCleanupJob(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Stats for monitoring
  getStats() {
    return {
      sessions: this.sessions.size,
      signals: this.signals.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => s.status !== 'ended').length,
    };
  }
}

export const inMemoryStore = new InMemorySessionStore();
