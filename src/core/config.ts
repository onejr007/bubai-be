import dotenv from 'dotenv';

dotenv.config();

// Parse MYSQL_URL if provided (Railway format)
function parseMySQLConfig() {
  const mysqlUrl = process.env.MYSQL_URL;
  
  if (mysqlUrl) {
    try {
      // Parse mysql://user:password@host:port/database
      const url = new URL(mysqlUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || '3306', 10),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading /
      };
    } catch (error) {
      console.warn('Failed to parse MYSQL_URL, falling back to individual variables');
    }
  }
  
  // Fallback to individual environment variables
  return {
    host: process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT || '3306', 10),
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'bubai',
  };
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://bub-ai.web.app',
    'https://bub-ai.firebaseapp.com',
  ],
  mysql: parseMySQLConfig(),
} as const;
