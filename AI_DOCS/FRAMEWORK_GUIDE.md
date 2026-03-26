# Framework Guide for AI Agents

## 🎓 Konsep Dasar

Framework ini dibangun dengan prinsip:
1. **Module Isolation** - Setiap fitur dalam module terpisah
2. **Auto-Loading** - Module otomatis ter-register
3. **Type Safety** - TypeScript untuk prevent errors
4. **Clear Structure** - Struktur yang konsisten

## 🏗️ Core Components

### 1. Module Loader (`src/core/moduleLoader.ts`)

Automatically loads all modules from `src/modules/` directory.

**Cara Kerja:**
- Scan folder `src/modules/`
- Load setiap module yang punya `routes.ts`
- Register ke Express dengan prefix `/api/v1/[module-name]`

**AI Agent tidak perlu:**
- Manual registration
- Edit core files
- Restart untuk load module baru

### 2. Config (`src/core/config.ts`)

Centralized configuration dari environment variables.

**Usage:**
```typescript
import { config } from '@/core/config';

console.log(config.port); // 3000
console.log(config.apiPrefix); // /api/v1
```

### 3. Logger (`src/core/logger.ts`)

Winston-based logging system.

**Usage:**
```typescript
import { logger } from '@/core/logger';

logger.info('Operation successful');
logger.error('Error occurred', error);
logger.warn('Warning message');
```

### 4. Error Handler (`src/core/middleware/errorHandler.ts`)

Centralized error handling.

**Usage:**
```typescript
import { AppError } from '@/core/middleware/errorHandler';

throw new AppError(404, 'Resource not found');
```

## 📦 Module Anatomy

### Minimal Module Structure

```
module-name/
├── routes.ts       # REQUIRED
├── controller.ts   # REQUIRED
├── service.ts      # REQUIRED
└── module.json     # REQUIRED
```

### routes.ts
```typescript
import { Router } from 'express';
import { controller } from './controller';

const router = Router();
router.get('/', controller.getAll);
export default router;
```

### controller.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { service } from './service';

class Controller {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getAll();
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
}

export const controller = new Controller();
```

### service.ts
```typescript
class Service {
  async getAll() {
    // Business logic here
    return [];
  }
}

export const service = new Service();
```

### module.json
```json
{
  "name": "module-name",
  "version": "1.0.0",
  "description": "Module description",
  "author": "Agent Name"
}
```

## 🔄 Request Flow

```
Client Request
    ↓
Express Middleware (cors, helmet, json parser)
    ↓
Module Router (auto-loaded)
    ↓
Controller (handle request)
    ↓
Service (business logic)
    ↓
Controller (format response)
    ↓
Error Handler (if error)
    ↓
Client Response
```

## 🎯 Path Aliases

TypeScript path aliases untuk clean imports:

```typescript
import { config } from '@/core/config';
import { logger } from '@/core/logger';
import { AppError } from '@/core/middleware/errorHandler';
```

Available aliases:
- `@/*` - src root
- `@core/*` - core folder
- `@modules/*` - modules folder
- `@utils/*` - utils folder

## 🛠️ Development Workflow

1. **Create Module**
   ```bash
   mkdir -p src/modules/my-module
   ```

2. **Copy Template**
   ```bash
   cp -r src/modules/example src/modules/my-module
   ```

3. **Customize**
   - Edit routes.ts
   - Edit controller.ts
   - Edit service.ts
   - Update module.json

4. **Test**
   ```bash
   npm run dev
   curl http://localhost:3000/api/v1/my-module
   ```

## 🚀 Deployment

Framework support multiple deployment platforms:

### Vercel
```bash
npm run build
vercel deploy
```

### Railway
```bash
railway up
```

### PM2 (VPS)
```bash
npm run build
pm2 start dist/index.js --name api
```

## 💡 Best Practices

1. **Always use try-catch in controllers**
2. **Use logger instead of console.log**
3. **Throw AppError for operational errors**
4. **Keep business logic in service layer**
5. **Use TypeScript types**
6. **Document in module.json**
7. **Update work log regularly**

## 🔍 Debugging

### Check if module loaded
```bash
# Look for log message
✅ Module loaded: module-name
```

### Test endpoint
```bash
curl http://localhost:3000/api/v1/module-name
```

### Check logs
```bash
npm run dev
# Watch console for errors
```

---

**Framework ini dirancang agar AI Agent bisa fokus pada business logic, bukan boilerplate!**
