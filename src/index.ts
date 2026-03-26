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
    // Connect to Couchbase (optional in development)
    try {
      await db.connect();
    } catch (dbError) {
      logger.warn('⚠️ Couchbase connection failed, continuing without database');
      logger.warn('Database-dependent endpoints will not work');
    }

    // Load all modules dynamically
    moduleLoader.loadModules(app);

    // Error Handler (must be last)
    app.use(errorHandler);

    // Start Server
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API Prefix: ${config.apiPrefix}`);
      logger.info(`📚 Swagger UI: http://localhost:${config.port}/api-docs`);
      logger.info(`📄 Swagger JSON: http://localhost:${config.port}/api-docs.json`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
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
