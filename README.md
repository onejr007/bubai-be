# AI Collaborative Backend Framework

Framework backend yang dirancang khusus untuk memudahkan kolaborasi multiple AI Agent (Claude, Gemini, ChatGPT, dll) dalam membangun aplikasi web.

## 🎯 Tujuan Framework

- Memungkinkan multiple AI Agent bekerja bersamaan tanpa konflik
- Struktur modular yang jelas dan terisolasi
- Auto-loading modules tanpa manual registration
- Dokumentasi yang mudah dipahami AI Agent
- Deployment mudah ke berbagai platform

## 🏗️ Arsitektur

```
BE/
├── src/
│   ├── core/              # Core framework (protected)
│   │   ├── config.ts
│   │   ├── logger.ts
│   │   ├── moduleLoader.ts
│   │   └── middleware/
│   ├── modules/           # AI Agent workspace
│   │   └── [module-name]/
│   └── utils/
├── AI_DOCS/               # AI Agent documentation
│   ├── README.md
│   ├── MODULE_CREATION.md
│   ├── COLLABORATION_RULES.md
│   └── AGENTS/
└── package.json
```

## 🚀 Quick Start

### Installation

```bash
cd BE
npm install
cp .env.example .env
# Edit .env with your Couchbase credentials
```

### Environment Setup

Update `.env` with your Couchbase Cloud credentials:

```env
COUCHBASE_CONNECTION_STRING=couchbases://your-cluster.cloud.couchbase.com
COUCHBASE_USERNAME=your-username
COUCHBASE_PASSWORD=your-password
COUCHBASE_BUCKET=your-bucket-name
```

### Development

```bash
npm run dev
```

### Build & Production

```bash
npm run build
npm start
```

## 📦 Tech Stack

- Node.js 18+
- TypeScript
- Express.js
- Couchbase Cloud (database)
- Winston (logging)
- Zod (validation)
- Helmet (security)

## 🤖 Untuk AI Agent

### Membuat Module Baru

1. Baca dokumentasi: `AI_DOCS/MODULE_CREATION.md`
2. Copy template dari `src/modules/example`
3. Ikuti aturan kolaborasi: `AI_DOCS/COLLABORATION_RULES.md`
4. Update work log di `AI_DOCS/AGENTS/[agent-name]/`

### Zona Kerja

✅ **SAFE ZONE** - Bebas edit:
- `src/modules/[module-anda]/`
- `AI_DOCS/AGENTS/[agent-name]/`

⚠️ **CAUTION ZONE** - Perlu koordinasi:
- `src/utils/`
- `AI_DOCS/`

🚫 **RESTRICTED ZONE** - Jangan edit:
- `src/core/`
- `src/index.ts`

## 📚 Dokumentasi Lengkap

### API Documentation (Swagger)
- Production: https://bub-ai-be.web.app/api-docs
- Development: http://localhost:3000/api-docs

### AI Agent Documentation
Semua dokumentasi untuk AI Agent ada di folder `AI_DOCS/`:

- [Framework Guide](./AI_DOCS/README.md)
- [Module Creation](./AI_DOCS/MODULE_CREATION.md)
- [Collaboration Rules](./AI_DOCS/COLLABORATION_RULES.md)
- [API Standards](./AI_DOCS/API_STANDARDS.md)
- [Database Guide](./AI_DOCS/DATABASE_GUIDE.md)
- [Swagger Guide](./AI_DOCS/SWAGGER_GUIDE.md) ⭐ NEW

## 🧪 Testing

```bash
# Health check (includes database status)
curl http://localhost:3000/health

# Test example module (in-memory)
curl http://localhost:3000/api/v1/example

# Test users module (Couchbase)
curl http://localhost:3000/api/v1/users

# Create user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

## 🚀 Deployment

### Recommended: Render.com (FREE)
```bash
# 1. Sign up at https://render.com
# 2. Connect GitHub repo
# 3. Deploy automatically with render.yaml
```

**Production URL:** Will be provided by Render
**Swagger Docs:** `https://your-app.onrender.com/api-docs`

### Other Free Platforms
Framework ini juga bisa di-deploy ke:
- ✅ Render.com (Recommended)
- ✅ Railway.app
- ✅ Vercel
- ✅ Cyclic.sh
- ❌ Firebase (requires Blaze plan for functions)

Lihat `DEPLOYMENT_FREE.md` untuk panduan lengkap platform gratis.

## 📝 Module Structure

Setiap module harus memiliki:

```
module-name/
├── routes.ts       # Route definitions
├── controller.ts   # Request handlers
├── service.ts      # Business logic
├── types.ts        # TypeScript types
├── module.json     # Module metadata
└── README.md       # Module docs
```

## 🔄 Auto-Loading

Modules akan otomatis di-load jika:
1. Ada di `src/modules/[nama-module]`
2. Memiliki `routes.ts` yang export default router
3. Format sesuai standard

## 🛡️ Security

- Helmet untuk HTTP headers
- CORS configuration
- Input validation dengan Zod
- Error handling terpusat
- Environment variables

## 📊 Logging

Menggunakan Winston untuk structured logging:

```typescript
import { logger } from '@/core/logger';

logger.info('Info message');
logger.error('Error message', error);
```

## 🤝 Collaboration

Multiple AI Agent bisa bekerja bersamaan dengan:
- Module isolation
- Clear naming conventions
- Work log protocol
- Safe zones definition

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check `AI_DOCS/` untuk dokumentasi
2. Review work log agent lain
3. Koordinasi di work log Anda

---

**Built for AI Agent Collaboration** 🤖🤝🤖
