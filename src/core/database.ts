import { Cluster, Bucket, Collection, connect } from 'couchbase';
import { config } from '@/core/config';
import { logger } from '@/core/logger';

class DatabaseService {
  private cluster: Cluster | null = null;
  private bucket: Bucket | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    // Couchbase connection is REQUIRED
    if (!config.couchbase.connectionString || !config.couchbase.username) {
      const error = new Error('❌ COUCHBASE CREDENTIALS REQUIRED! Please configure COUCHBASE_CONNECTION_STRING and COUCHBASE_USERNAME in .env');
      logger.error(error.message);
      throw error;
    }

    try {
      logger.info('🔌 Connecting to Couchbase...');
      logger.info(`📍 Connection String: ${config.couchbase.connectionString}`);
      logger.info(`👤 Username: ${config.couchbase.username}`);
      logger.info(`🗄️  Bucket: ${config.couchbase.bucket}`);

      // Connect with timeout
      const connectPromise = connect(config.couchbase.connectionString, {
        username: config.couchbase.username,
        password: config.couchbase.password,
        configProfile: 'wanDevelopment',
      });

      // Timeout after 30 seconds (increased for cloud connection)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
      );

      this.cluster = await Promise.race([connectPromise, timeoutPromise]) as Cluster;

      logger.info('✅ Cluster connected, accessing bucket...');
      this.bucket = this.cluster.bucket(config.couchbase.bucket);
      
      // Test connection by getting a collection
      const collection = this.bucket.scope('_default').collection('_default');
      logger.info('✅ Collection accessible');
      
      this.isConnected = true;
      logger.info('✅ Couchbase connected successfully!');
      logger.info('🎉 Database ready for operations');
    } catch (error: any) {
      logger.error('❌ Couchbase connection failed:', error);
      logger.error('Stack:', error.stack);
      throw new Error(`Failed to connect to Couchbase: ${error.message}`);
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
