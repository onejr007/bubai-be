import { Cluster, Bucket, Collection, connect } from 'couchbase';
import { config } from '@/core/config';
import { logger } from '@/core/logger';

class DatabaseService {
  private cluster: Cluster | null = null;
  private bucket: Bucket | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      logger.info('🔌 Connecting to Couchbase...');

      // Add timeout for connection
      const connectPromise = connect(config.couchbase.connectionString, {
        username: config.couchbase.username,
        password: config.couchbase.password,
        configProfile: 'wanDevelopment',
      });

      // Timeout after 10 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );

      this.cluster = await Promise.race([connectPromise, timeoutPromise]) as Cluster;

      this.bucket = this.cluster.bucket(config.couchbase.bucket);
      
      // Test connection by getting a collection
      const collection = this.bucket.scope('_default').collection('_default');
      
      this.isConnected = true;
      logger.info('✅ Couchbase connected successfully');
    } catch (error) {
      logger.error('❌ Couchbase connection failed:', error);
      throw error;
    }
  }

  getCluster(): Cluster {
    if (!this.cluster || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.cluster;
  }

  getBucket(): Bucket {
    if (!this.bucket || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.bucket;
  }

  getCollection(scopeName: string = '_default', collectionName: string = '_default'): Collection {
    const bucket = this.getBucket();
    return bucket.scope(scopeName).collection(collectionName);
  }

  async disconnect(): Promise<void> {
    if (this.cluster) {
      await this.cluster.close();
      this.isConnected = false;
      logger.info('🔌 Couchbase disconnected');
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const db = new DatabaseService();
