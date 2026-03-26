import mysql from 'mysql2/promise';
import { config } from '@/core/config';
import { logger } from '@/core/logger';

class DatabaseService {
  private pool: mysql.Pool | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    // MySQL connection is REQUIRED
    if (!config.mysql.host || !config.mysql.user) {
      const error = new Error('❌ MYSQL CREDENTIALS REQUIRED! Please configure MYSQLHOST and MYSQLUSER in environment variables');
      logger.error(error.message);
      throw error;
    }

    try {
      logger.info('🔌 Connecting to MySQL...');
      logger.info(`📍 Host: ${config.mysql.host}:${config.mysql.port}`);
      logger.info(`👤 User: ${config.mysql.user}`);
      logger.info(`🗄️  Database: ${config.mysql.database}`);
      
      // Debug: Log environment variables (without password)
      logger.info('🔍 Environment check:');
      logger.info(`  - MYSQL_URL: ${process.env.MYSQL_URL ? '***SET***' : 'NOT SET'}`);
      logger.info(`  - MYSQLHOST: ${process.env.MYSQLHOST || 'NOT SET'}`);
      logger.info(`  - MYSQLPORT: ${process.env.MYSQLPORT || 'NOT SET'}`);
      logger.info(`  - MYSQLUSER: ${process.env.MYSQLUSER || 'NOT SET'}`);
      logger.info(`  - MYSQLDATABASE: ${process.env.MYSQLDATABASE || 'NOT SET'}`);
      logger.info(`  - MYSQLPASSWORD: ${process.env.MYSQLPASSWORD ? '***SET***' : 'NOT SET'}`);
      logger.info(`  - Parsed config: ${config.mysql.host}:${config.mysql.port}`);
      // Create connection pool
      this.pool = mysql.createPool({
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });

      // Test connection
      const connection = await this.pool.getConnection();
      logger.info('✅ MySQL connection established');
      
      // Create tables if not exist
      await this.initializeTables(connection);
      
      connection.release();
      
      this.isConnected = true;
      logger.info('✅ MySQL connected successfully!');
      logger.info('🎉 Database ready for operations');
    } catch (error: any) {
      logger.error('❌ MySQL connection failed:', error);
      logger.error('Stack:', error.stack);
      throw new Error(`Failed to connect to MySQL: ${error.message}`);
    }
  }

  private async initializeTables(connection: mysql.PoolConnection): Promise<void> {
    try {
      logger.info('📋 Initializing database tables...');

      // Create users table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          INDEX idx_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      logger.info('✅ Table created/verified: users');

      // Create hp_cam_sessions table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS hp_cam_sessions (
          session_id VARCHAR(36) PRIMARY KEY,
          pairing_code VARCHAR(6) NOT NULL,
          device_id VARCHAR(255) NOT NULL,
          status ENUM('waiting', 'paired', 'ended') NOT NULL DEFAULT 'waiting',
          has_viewer BOOLEAN NOT NULL DEFAULT FALSE,
          viewer_device_id VARCHAR(255),
          created_at DATETIME NOT NULL,
          expires_at DATETIME NOT NULL,
          paired_at DATETIME,
          last_activity DATETIME NOT NULL,
          INDEX idx_pairing_code (pairing_code),
          INDEX idx_status (status),
          INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      logger.info('✅ Table created/verified: hp_cam_sessions');

      // Create hp_cam_signals table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS hp_cam_signals (
          id VARCHAR(36) PRIMARY KEY,
          session_id VARCHAR(36) NOT NULL,
          type VARCHAR(50) NOT NULL,
          from_device ENUM('mobile', 'viewer') NOT NULL,
          to_device ENUM('mobile', 'viewer') NOT NULL,
          data JSON NOT NULL,
          timestamp DATETIME NOT NULL,
          delivered BOOLEAN NOT NULL DEFAULT FALSE,
          INDEX idx_session_id (session_id),
          INDEX idx_to_device (to_device),
          INDEX idx_delivered (delivered),
          INDEX idx_timestamp (timestamp),
          FOREIGN KEY (session_id) REFERENCES hp_cam_sessions(session_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      logger.info('✅ Table created/verified: hp_cam_signals');

      logger.info('✅ Database tables initialized');
    } catch (error: any) {
      logger.error('❌ Failed to initialize tables:', error);
      throw error;
    }
  }

  getPool(): mysql.Pool {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const pool = this.getPool();
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('🔌 MySQL disconnected');
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}

export const db = new DatabaseService();
