import dotenv from 'dotenv';

dotenv.config();

// Parse MYSQL_URL if provided (Railway format)
function parseMySQLConfig() {
  // DEBUG: Print ALL environment variables
  console.log('='.repeat(60));
  console.log('DEBUG: ALL ENVIRONMENT VARIABLES:');
  console.log('='.repeat(60));
  Object.keys(process.env).sort().forEach(key => {
    if (key.includes('MYSQL') || key.includes('DATABASE')) {
      // Show MySQL related vars with masked password
      const value = process.env[key];
      if (key.includes('PASSWORD') || key.includes('PASS')) {
        console.log(`${key}=${value ? '***MASKED***' : 'undefined'}`);
      } else {
        console.log(`${key}=${value || '(empty)'}`);
      }
    }
  });
  console.log('='.repeat(60));
  
  // Check if MYSQLHOST is empty
  if (!process.env.MYSQLHOST || process.env.MYSQLHOST.trim() === '') {
    console.error('❌ CRITICAL: MYSQLHOST is empty!');
    console.error('This means Railway MySQL service variables are not properly set.');
    console.error('');
    console.error('Possible causes:');
    console.error('1. MySQL service is still provisioning (wait 1-2 minutes)');
    console.error('2. Shared variables not properly linked');
    console.error('3. MySQL service has an issue');
    console.error('');
    console.error('Solution:');
    console.error('1. Check MySQL service status in Railway dashboard');
    console.error('2. Verify MySQL service is running (green status)');
    console.error('3. Check MySQL service Variables tab for MYSQLHOST value');
    console.error('4. If MYSQLHOST exists in MySQL service, manually copy it to backend service');
    console.error('');
    throw new Error('MYSQLHOST environment variable is empty. Cannot connect to database.');
  }
  
  const mysqlUrl = process.env.MYSQL_URL;
  
  if (mysqlUrl && mysqlUrl.includes('@') && !mysqlUrl.includes('@:')) {
    // MYSQL_URL has hostname
    try {
      const url = new URL(mysqlUrl);
      console.log('✅ Parsed MYSQL_URL successfully:', {
        host: url.hostname,
        port: url.port,
        user: url.username,
        database: url.pathname.slice(1),
      });
      return {
        host: url.hostname,
        port: parseInt(url.port || '3306', 10),
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
      };
    } catch (error) {
      console.warn('⚠️ Failed to parse MYSQL_URL, using individual variables');
    }
  } else if (mysqlUrl) {
    console.warn('⚠️ MYSQL_URL is malformed (missing hostname):', mysqlUrl);
  }
  
  // Use individual environment variables
  console.log('✅ Using individual environment variables');
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
