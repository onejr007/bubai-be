import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from '@/core/config';
import { logger } from '@/core/logger';
import { errorHandler } from '@/core/middleware/errorHandler';
import { moduleLoader } from '@/core/moduleLoader';
import { db } from '@/core/database';
import { swaggerSpec } from '@/core/swagger';

const app = express();

// Security & Parsing Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow Swagger UI
}));

// CORS - Allow Firebase hosting and localhost
app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://bub-ai.web.app',
    'https://bub-ai.firebaseapp.com',
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Check if the API and database are running
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: connected
 */
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: db.isReady() ? 'connected' : 'disconnected'
  });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI Collaborative Backend API',
}));

// Swagger JSON
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Initialize Database and Start Server
async function startServer() {
  try {
    // Connect to MySQL (REQUIRED - NO FALLBACK)
    logger.info('🚀 Starting server initialization...');
    
    logger.info('🔌 Connecting to MySQL (REQUIRED)...');
    await db.connect();
    logger.info('✅ Database connection established');

    // Load all modules dynamically
    logger.info('📦 Loading modules...');
    moduleLoader.loadModules(app);
    logger.info('✅ Modules loaded successfully');

    // Error Handler (must be last)
    app.use(errorHandler);

    // Start Server
    app.listen(config.port, () => {
      logger.info('='.repeat(60));
      logger.info('🚀 Server running successfully!');
      logger.info('='.repeat(60));
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🌐 Port: ${config.port}`);
      logger.info(`🔗 API Prefix: ${config.apiPrefix}`);
      logger.info(`🗄️  Database: MySQL (Connected)`);
      logger.info(`📚 Swagger UI: http://localhost:${config.port}/api-docs`);
      logger.info(`📄 Swagger JSON: http://localhost:${config.port}/api-docs.json`);
      logger.info(`💚 Health Check: http://localhost:${config.port}/health`);
      logger.info('='.repeat(60));
    });
  } catch (error: any) {
    logger.error('❌ Failed to start server:', error);
    logger.error('💥 CRITICAL: MySQL connection is REQUIRED. Server cannot start without database.');
    logger.error('Please check:');
    logger.error('  1. MySQL service is running (Railway MySQL or local MySQL)');
    logger.error('  2. MYSQLHOST, MYSQLUSER, MYSQLPASSWORD are correct in environment variables');
    logger.error('  3. Network connectivity to MySQL server');
    logger.error('  4. Database exists and is accessible');
    logger.error('');
    logger.error('For Railway deployment:');
    logger.error('  - Add MySQL service in Railway dashboard');
    logger.error('  - Railway will auto-set environment variables');
    logger.error('  - Redeploy after adding MySQL service');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

startServer();
