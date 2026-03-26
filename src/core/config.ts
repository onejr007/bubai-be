import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  couchbase: {
    connectionString: process.env.COUCHBASE_CONNECTION_STRING || '',
    username: process.env.COUCHBASE_USERNAME || '',
    password: process.env.COUCHBASE_PASSWORD || '',
    bucket: process.env.COUCHBASE_BUCKET || '',
  },
} as const;
