import dotenv from 'dotenv';

dotenv.config();

// Parse MySQL Configuration from Railway Environment
function parseMySQLConfig() {
  const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_PUBLIC_URL;

  // Step 1: Start with individual env vars (highest priority — Railway injects these directly)
  let host = (process.env.MYSQLHOST || '').trim();
  let port = parseInt((process.env.MYSQLPORT || '').trim() || '3306', 10);
  let user = (process.env.MYSQLUSER || process.env.MYSQL_USER || '').trim();
  let password = (process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '').trim();
  let database = (process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway').trim();

  // Step 2: Fill in any MISSING values from the URL (URL is fallback, not override)
  if (mysqlUrl) {
    try {
      // Use Node's built-in URL parser — handles special chars & percent-encoding correctly
      const parsed = new URL(mysqlUrl.trim());
      console.log('🔑 Found credentials in Database URL...');

      if (!user && parsed.username) user = decodeURIComponent(parsed.username);
      if (!password && parsed.password) password = decodeURIComponent(parsed.password);
      if (!host && parsed.hostname) host = parsed.hostname;
      if (parsed.port && !process.env.MYSQLPORT) port = parseInt(parsed.port, 10);
      const dbFromUrl = parsed.pathname.replace(/^\//, '');
      if (!database || database === 'railway') database = dbFromUrl || database;
    } catch (err: any) {
      console.warn(`⚠️  Could not parse MYSQL_URL (${err.message}) — skipping URL-based credential extraction.`);
    }
  }

  // Step 3: Resolve host with Railway fallback
  if (!host || host === '' || host === '(empty)' || host.startsWith('${{')) {
    if (process.env.RAILWAY_ENVIRONMENT) {
      host = 'mysql.railway.internal';
      port = 3306;
      console.log(`🌐 Railway Environment detected. Using internal host: "${host}"`);
    } else {
      host = 'crossover.proxy.rlwy.net';
      port = 26236;
      console.log(`🌐 Using project-specific public proxy fallback: ${host}:${port}`);
    }
  } else {
    console.log(`✅ Using configured host: ${host}`);
  }

  // Step 4: Final credential source report (masked for security)
  const passHint = password ? password.substring(0, 3) : 'NONE';
  console.log('🔍 Database Parameters Check:');
  console.log(`   - User: ${user || '(NOT SET)'}`);
  console.log(`   - Host: ${host}:${port}`);
  console.log(`   - DB:   ${database}`);
  console.log(`   - Pass: ${passHint}... (${password.length} characters)`);

  if (!host && process.env.NODE_ENV === 'production') {
    throw new Error('❌ FATAL: No database host found in production.');
  }

  if (!user || !password) {
    console.warn('⚠️  WARNING: MySQL user or password is empty! Connection will likely fail.');
    console.warn('   Set MYSQLUSER and MYSQLPASSWORD in your Railway Backend service variables.');
  }

  return {
    host: host || 'localhost',
    port,
    user: user || 'root',
    password,
    database,
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
