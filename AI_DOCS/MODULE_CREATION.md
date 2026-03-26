# Module Creation Guide for AI Agents

## 📦 Apa itu Module?

Module adalah unit fitur yang terisolasi dan independen. Setiap module memiliki:
- Routes sendiri
- Controller sendiri
- Service/business logic sendiri
- Types/interfaces sendiri

## 🎯 Kapan Membuat Module Baru?

Buat module baru ketika:
- Menambah fitur baru yang independen
- Fitur memiliki domain logic tersendiri
- Ingin menghindari konflik dengan agent lain

## 📋 Struktur Module Standard

```
src/modules/[module-name]/
├── routes.ts          # Route definitions (WAJIB)
├── controller.ts      # Request handlers (WAJIB)
├── service.ts         # Business logic (WAJIB)
├── types.ts           # TypeScript interfaces (OPSIONAL)
├── validation.ts      # Input validation (OPSIONAL)
├── module.json        # Module metadata (WAJIB)
└── README.md          # Module documentation (RECOMMENDED)
```

## 🛠️ Step-by-Step: Membuat Module Baru

### Step 1: Buat Folder Module

```bash
mkdir -p src/modules/[nama-module]
```

### Step 2: Buat module.json

```json
{
  "name": "nama-module",
  "version": "1.0.0",
  "description": "Deskripsi singkat module",
  "author": "Agent Name (Claude/Gemini/etc)",
  "createdAt": "2026-03-26",
  "routes": [
    {
      "method": "GET",
      "path": "/",
      "description": "Deskripsi endpoint"
    }
  ],
  "dependencies": [],
  "notes": "Catatan tambahan jika ada"
}
```

### Step 3: Buat routes.ts

```typescript
import { Router } from 'express';
import { namaController } from './controller';

const router = Router();

// Define your routes here
router.get('/', namaController.getAll);
router.post('/', namaController.create);

export default router;
```

### Step 4: Buat controller.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { namaService } from './service';

class NamaController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await namaService.getAll();
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await namaService.create(req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }
}

export const namaController = new NamaController();
```

### Step 5: Buat service.ts

```typescript
import { AppError } from '@/core/middleware/errorHandler';

class NamaService {
  async getAll() {
    // Business logic here
    return [];
  }

  async create(payload: any) {
    // Business logic here
    return payload;
  }
}

export const namaService = new NamaService();
```

## ✅ Checklist Sebelum Commit

- [ ] module.json sudah dibuat dan valid
- [ ] routes.ts export default router
- [ ] controller.ts handle error dengan try-catch
- [ ] service.ts berisi business logic
- [ ] Test endpoint dengan curl/Postman
- [ ] Update AI_DOCS/AGENTS/[agent-name]/WORK_LOG.md

## 🚫 Yang TIDAK Boleh Dilakukan

1. Jangan edit core framework tanpa koordinasi
2. Jangan edit module agent lain
3. Jangan hardcode configuration (gunakan .env)
4. Jangan skip error handling
5. Jangan lupa dokumentasi

## 📝 Response Format Standard

Semua API response harus mengikuti format:

```typescript
// Success
{
  "status": "success",
  "data": { ... }
}

// Error
{
  "status": "error",
  "message": "Error message"
}
```

## 🔄 Auto-Loading

Module akan otomatis di-load oleh `moduleLoader` jika:
1. Ada di folder `src/modules/[nama-module]`
2. Memiliki file `routes.ts`
3. Export default router

URL endpoint: `http://localhost:3000/api/v1/[nama-module]`

## 💡 Tips untuk AI Agent

1. Copy folder `example` sebagai starting point
2. Rename semua reference ke nama module baru
3. Test incremental (routes → controller → service)
4. Commit setelah setiap step berhasil
5. Update work log secara berkala

---

**Framework ini dirancang agar AI Agent bisa bekerja paralel tanpa konflik!**
