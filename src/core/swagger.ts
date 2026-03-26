import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '@/core/config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Collaborative Backend API',
      version: '1.0.0',
      description: 'Backend framework designed for AI Agent collaboration with Couchbase Cloud integration',
      contact: {
        name: 'API Support',
        url: 'https://bub-ai-be.web.app',
      },
    },
    servers: [
      {
        url: 'https://bub-ai-be.web.app',
        description: 'Production server (Firebase)',
      },
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Example',
        description: 'Example module endpoints (in-memory)',
      },
      {
        name: 'Users',
        description: 'User management endpoints (Couchbase)',
      },
      {
        name: 'HP Camera Session',
        description: 'HP Camera session management with temporary storage',
      },
    ],
    components: {
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            data: {
              type: 'object',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              example: 'Error description',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-26T10:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-03-26T10:00:00.000Z',
            },
          },
        },
        UserInput: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/*/routes.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
