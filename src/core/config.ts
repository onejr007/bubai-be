import dotenv from 'dotenv';

dotenv.config();

// Parse MYSQL_URL if provided (Railway format)
function parseMySQLConfig() {
  const mysqlUrl = process.env.MYSQL_URL;
  const publicUrl = process.env.MYSQL_PUBLIC_URL;
  const host = process.env.MYSQLHOST;
  const port = process.env.MYSQLPORT;
  const user = process.env.MYSQLUSER;
  const password = process.env.MYSQLPASSWORD;
  const database = process.env.MYSQLDATABASE;

  // DEBUG: Masked Variable Check
  console.log('🔍 Database Environment Check:');
  console.log(`  - MYSQLHOST: ${host || '(empty)'}`);
  console.log(`  - MYSQLPORT: ${port || '(empty)'}`);
  console.log(`  - MYSQLUSER: ${user || '(empty)'}`);
  console.log(`  - MYSQLDATABASE: ${database || '(empty)'}`);
  console.log(`  - MYSQLPASSWORD: ${password ? '***SET***' : '(empty)'}`);
  console.log(`  - MYSQL_URL Trace: ${mysqlUrl ? mysqlUrl.replace(/:[^:@/]+@/, ':***PASSWORD***@') : '(empty)'}`);

  // 1. Detect unresolved Railway references
  if (host?.startsWith('${{')) {
    console.error('❌ CRITICAL: Unresolved Railway Shared Variable detected!');
    console.error(`MYSQLHOST is "${host}". Railway has not resolved this reference.`);
    console.error('Action: Redeploy your service in the Railway dashboard.');
  }

  // 2. Try to parse MYSQL_URL or MYSQL_PUBLIC_URL
  const urlToParse = mysqlUrl || publicUrl;
  if (urlToParse && urlToParse.includes('@')) {
    try {
      const url = new URL(urlToParse);
      // Valid if hostname exists
      if (url.hostname && url.hostname !== '') {
        console.log('✅ Parsed Database URL successfully');
        return {
          host: url.hostname,
          port: parseInt(url.port || '3306', 10),
          user: url.username,
          password: decodeURIComponent(url.password),
          database: url.pathname.slice(1),
        };
      } else {
        console.warn('⚠️  Database URL exists but has no hostname:', urlToParse.replace(/:[^:@/]+@/, ':***PASSWORD***@'));
      }
    } catch (error) {
      console.warn('⚠️  Failed to parse Database URL, falling back to individual variables');
    }
  }

  // 3. Fallback to individual variables
  if (host && host.trim() !== '') {
    console.log('✅ Using individual environment variables');
    return {
      host: host,
      port: parseInt(port || '3306', 10),
      user: user || 'root',
      password: password || '',
      database: database || 'railway',
    };
  }

  // 3.5 Try Railway Private Networking Host (default: mysql)
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🌐 Railway Environment detected. Attempting internal host: "mysql"');
    // We don't return here yet, we'll try this but keep public proxy as another option
    // Actually, let's prioritize private networking but allow fallback
  }

  // 3.6 Project-Specific Public Proxy Fallback (User provided)
  const fallbackHost = process.env.RAILWAY_ENVIRONMENT ? 'mysql' : 'crossover.proxy.rlwy.net';
  const fallbackPort = process.env.RAILWAY_ENVIRONMENT ? 3306 : 26236;

  if (process.env.RAILWAY_ENVIRONMENT) {
    // Return private host as first choice in Railway
    return {
      host: 'mysql',
      port: 3306,
      user: user || 'root',
      password: password || '',
      database: database || 'railway',
    };
  }

  // If we reach here outside Railway or if specifically needed
  console.log(`🌐 Using project-specific fallback: ${fallbackHost}:${fallbackPort}`);
  return {
    host: fallbackHost,
    port: fallbackPort,
    user: user || 'root',
    password: password || '',
    database: database || 'railway',
  };

  // 4. CRITICAL FAILURE: No host found
  console.error('❌ FATAL: No valid MySQL Host found!');
  console.error('Railway environment variables are missing or malformed.');
  console.error('');
  console.error('HOW TO FIX:');
  console.error('1. Go to your Railway MySQL service -> Variables tab.');
  console.error('2. Copy the value of MYSQLHOST (e.g., containers-us-west-xxx.railway.app).');
  console.error('3. Go to your Backend service -> Variables tab.');
  console.error('4. Manually add MYSQLHOST with the value you copied.');
  console.error('5. Do the same for MYSQLPASSWORD and MYSQLPORT if they are missing.');
  console.error('');
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database configuration failed. Check Railway environment variables.');
  }

  // Development defaults
  return {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bubai',
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
