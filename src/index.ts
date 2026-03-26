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
app.use(cors({ origin: config.allowedOrigins }));
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
app.get('/health', (req, res) => {
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
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Initialize Database and Start Server
async function startServer() {
  try {
    // Connect to Couchbase (REQUIRED)
    logger.info('🚀 Starting server initialization...');
    
    try {
      await db.connect();
      logger.info('✅ Database connection established');
    } catch (dbError: any) {
      logger.error('❌ CRITICAL: Database connection failed!');
      logger.error('Error:', dbError.message);
      logger.error('⚠️ Server cannot start without database connection');
      process.exit(1); // Exit if database connection fails
    }

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
      logger.info(`🗄️  Database: Couchbase (Connected)`);
      logger.info(`📚 Swagger UI: http://localhost:${config.port}/api-docs`);
      logger.info(`📄 Swagger JSON: http://localhost:${config.port}/api-docs.json`);
      logger.info(`💚 Health Check: http://localhost:${config.port}/health`);
      logger.info('='.repeat(60));
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
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
