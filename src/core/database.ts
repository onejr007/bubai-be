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
        timeouts: {
          kvTimeout: 10000, // 10 seconds for KV operations
          queryTimeout: 75000, // 75 seconds for queries
        },
      });

      // Timeout after 30 seconds (increased for cloud connection)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
      );

      this.cluster = await Promise.race([connectPromise, timeoutPromise]) as Cluster;

      logger.info('✅ Cluster connected, accessing bucket...');
      this.bucket = this.cluster.bucket(config.couchbase.bucket);
      
      // Warmup collections to ensure metadata is loaded
      logger.info('🔥 Warming up collections...');
      await this.warmupCollections();
      
      this.isConnected = true;
      logger.info('✅ Couchbase connected successfully!');
      logger.info('🎉 Database ready for operations');
    } catch (error: any) {
      logger.error('❌ Couchbase connection failed:', error);
      logger.error('Stack:', error.stack);
      throw new Error(`Failed to connect to Couchbase: ${error.message}`);
    }
  }

  private async warmupCollections(): Promise<void> {
    try {
      logger.info('🔥 Starting collection warmup...');
      
      const collections = ['hp_cam_sessions', 'hp_cam_signals'];
      const cluster = this.cluster!;
      const bucketName = this.bucket!.name;
      
      // Create primary indexes to ensure collections are queryable
      for (const collectionName of collections) {
        try {
          const indexQuery = `
            CREATE PRIMARY INDEX IF NOT EXISTS ON \`${bucketName}\`._default.${collectionName}
          `;
          await cluster.query(indexQuery, { timeout: 30000 });
          logger.info(`✅ Primary index ensured for: ${collectionName}`);
        } catch (error: any) {
          // Index might already exist or creation not supported
          logger.info(`ℹ️  Index check for ${collectionName}: ${error.message}`);
        }
      }
      
      // Wait for metadata propagation (critical for cloud)
      logger.info('⏳ Waiting for metadata propagation (5 seconds)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify collections are accessible
      for (const collectionName of collections) {
        let retries = 3;
        while (retries > 0) {
          try {
            const collection = this.bucket!.scope('_default').collection(collectionName);
            // Try a simple upsert operation to ensure collection is writable
            await collection.upsert('__warmup_test__', { test: true }, { 
              timeout: 10000,
              expiry: 10 
            });
            await collection.remove('__warmup_test__').catch(() => {});
            logger.info(`✅ Collection ready: ${collectionName}`);
            break;
          } catch (error: any) {
            retries--;
            if (retries === 0) {
              logger.warn(`⚠️ Collection ${collectionName} not ready after warmup: ${error.message}`);
            } else {
              logger.info(`ℹ️  Retrying warmup for ${collectionName} (${retries} left)...`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      }
      
      logger.info('✅ Collection warmup completed');
    } catch (error: any) {
      logger.warn('⚠️ Collection warmup had issues (non-critical):', error.message);
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
