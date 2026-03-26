# Backend Documentation

> **v2.1 - Node.js + Express + TypeScript Modular Backend**

**Last Updated**: 2024-03-26

**⚠️ AI Agent**: 
- Update file ini untuk fitur backend baru
- Jangan buat file dokumentasi terpisah
- Gunakan versioning (v2.1, v2.2, dst)
- Update CHANGELOG.md

---

## 📋 Daftar Isi

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Module Development](#module-development)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Backend ini menggunakan arsitektur modular yang memungkinkan:
- ✅ Penambahan fitur tanpa mengubah core
- ✅ Auto-loading modules
- ✅ Auto-generated Swagger documentation
- ✅ Centralized error handling
- ✅ Database integration (MySQL & Couchbase)

### Tech Stack
- Node.js >= 18
- Express.js
- TypeScript
- MySQL (Primary)
- Couchbase (Optional)

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_db

# Couchbase (optional)
DB_CONNECTION_STRING=couchbase://localhost
DB_USERNAME=Administrator
DB_PASSWORD=password
DB_BUCKET=default
```

### 3. Development
```bash
npm run dev
```

### 4. Build & Production
```bash
npm run build
npm start
```

### 5. Verify
- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- Health: http://localhost:3000/health

---

## 🏗️ Architecture

```
src/
├── core/                    # Framework core (jangan edit)
│   ├── config.ts           # Configuration loader
│   ├── database.ts         # Database connection
│   ├── logger.ts           # Winston logger
│   ├── moduleLoader.ts     # Auto module loader
│   ├── swagger.ts          # Swagger generator
│   └── middleware/
│       └── errorHandler.ts # Global error handler
│
├── modules/                 # Feature modules
│   ├── example/            # Example module
│   ├── users/              # Users module
│   └── hp-cam-session/     # HP Cam Session module
│
├── utils/                   # Shared utilities
└── index.ts                # Application entry point
```

### Module Structure
```
modules/your-module/
├── module.json       # Module metadata
├── routes.ts         # Express routes
├── controller.ts     # Request handlers
├── service.ts        # Business logic
├── types.ts          # TypeScript types
└── README.md         # Module documentation
```

---

## 🔧 Module Development

### 1. Create New Module

```bash
# Copy example module
cp -r src/modules/example src/modules/your-module
```

### 2. Configure Module (`module.json`)

```json
{
  "name": "your-module",
  "version": "1.0.0",
  "description": "Your module description",
  "enabled": true,
  "routes": {
    "prefix": "/api/your-module"
  }
}
```

### 3. Define Routes (`routes.ts`)

```typescript
import { Router } from 'express';
import * as controller from './controller';

const router = Router();

/**
 * @swagger
 * /api/your-module:
 *   get:
 *     summary: Get all items
 *     tags: [YourModule]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', controller.getAll);

export default router;
```

### 4. Implement Controller (`controller.ts`)

```typescript
import { Request, Response, NextFunction } from 'express';
import * as service from './service';

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await service.getAll();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
```

### 5. Business Logic (`service.ts`)

```typescript
export const getAll = async () => {
  // Your business logic here
  return [];
};
```

### 6. Restart Server
Module akan otomatis ter-load saat server restart.

**Detailed Guide**: [AI_DOCS/MODULE_CREATION.md](./AI_DOCS/MODULE_CREATION.md)

---

## 📡 API Documentation

### Swagger UI
Akses: http://localhost:3000/api-docs

### Available Modules

#### Example Module
```
GET    /api/example          # Get all examples
GET    /api/example/:id      # Get by ID
POST   /api/example          # Create
PUT    /api/example/:id      # Update
DELETE /api/example/:id      # Delete
```

#### Users Module
```
GET    /api/users            # Get all users
GET    /api/users/:id        # Get user by ID
POST   /api/users            # Create user
PUT    /api/users/:id        # Update user
DELETE /api/users/:id        # Delete user
```

#### HP Cam Session Module
```
POST   /api/hp-cam-session/start    # Start session
POST   /api/hp-cam-session/stop     # Stop session
GET    /api/hp-cam-session/:id      # Get session
```

---

## 🚀 Deployment

### Railway (Recommended)

1. **Install CLI**:
```bash
npm install -g @railway/cli
```

2. **Login & Deploy**:
```bash
railway login
railway init
railway up
```

3. **Set Environment Variables**:
```bash
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=https://your-frontend.com
```

**Detailed Guide**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

### Other Platforms
- **Render**: [../DEPLOYMENT.md](../DEPLOYMENT.md)
- **Vercel**: [../DEPLOYMENT.md](../DEPLOYMENT.md)

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Module Not Loading
1. Check `module.json` exists
2. Verify `enabled: true`
3. Check console logs
4. Restart server

### Build Failed
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Failed
1. Verify credentials in `.env`
2. Check database (MySQL/Couchbase) is running
3. Test connection: `curl http://localhost:8091`

**More Solutions**: [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md)

---

## 📚 Additional Resources

- **[Module Creation Guide](./AI_DOCS/MODULE_CREATION.md)** - Cara membuat module baru
- **[API Standards](./AI_DOCS/API_STANDARDS.md)** - API best practices
- **[Database Guide](./AI_DOCS/DATABASE_GUIDE.md)** - Database integration
- **[Swagger Guide](./AI_DOCS/SWAGGER_GUIDE.md)** - Swagger documentation

---

**Version**: 2.1
**Last Updated**: 2024-03-26
**Need Help?** Check [Troubleshooting](#troubleshooting) atau [Main Documentation](../README.md)
