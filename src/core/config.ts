import dotenv from 'dotenv';

dotenv.config();

// Parse MySQL Configuration from Railway Environment
function parseMySQLConfig() {
  const mysqlUrl = process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL;
  
  // Default values from environment or fallbacks
  let host = process.env.MYSQLHOST;
  let port = parseInt(process.env.MYSQLPORT || '3306', 10);
  let user = process.env.MYSQLUSER || 'root';
  let password = process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || '';
  let database = process.env.MYSQLDATABASE || 'railway';

  // 1. Extra smart password/host extraction using Regex (robust against malformed URLs)
  if (mysqlUrl) {
    // Matches: mysql://user:pass@host:port/database
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:/]*):?(\d*)\/(.+)/;
    const match = mysqlUrl.match(regex);

    if (match) {
      console.log('🔑 Found credentials in Database URL...');
      const [_, u, p, h, prt, db] = match;
      if (u) user = u;
      if (p) password = decodeURIComponent(p);
      if (h && h !== '') host = h;
      if (prt) port = parseInt(prt, 10);
      if (db) database = db;
    }
  }

  // 2. Resolve Host / Priority Fallback
  if (!host || host === '' || host === '(empty)' || host.startsWith('${{')) {
    if (process.env.RAILWAY_ENVIRONMENT) {
      // Use Railway Private Networking Host
      host = 'mysql.railway.internal';
      port = 3306;
      console.log(`🌐 Railway Environment detected. Attempting internal host: "${host}"`);
    } else {
      // Use Railway Public Proxy Fallback (User provided)
      host = 'crossover.proxy.rlwy.net';
      port = 26236;
      console.log(`🌐 Using project-specific public proxy fallback: ${host}:${port}`);
    }
  } else {
    console.log(`✅ Using configured host: ${host}`);
  }

  // Debug Info (Masked for security but helpful for verification)
  const passHint = password ? password.substring(0, 3) : 'NONE';
  console.log('🔍 Database Parameters Check:');
  console.log(`   - Host: ${host}:${port}`);
  console.log(`   - User: ${user}`);
  console.log(`   - DB:   ${database}`);
  console.log(`   - Pass: ${passHint}... (${password.length} characters)`);

  if (!host && process.env.NODE_ENV === 'production') {
    throw new Error('❌ FATAL: No database host found in production.');
  }

  return {
    host: host || 'localhost',
    port: port,
    user: user,
    password: password,
    database: database,
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
    'https://bubai-production.up.railway.app'
  ],
  mysql: parseMySQLConfig(),
} as const;
