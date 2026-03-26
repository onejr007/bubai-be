# AI Agent Documentation

Dokumentasi ini dirancang khusus untuk AI Agent (Claude, Gemini, ChatGPT, dll) yang bekerja pada project ini.

## 📋 Daftar Isi

1. [Framework Overview](./FRAMEWORK_GUIDE.md)
2. [Module Creation Guide](./MODULE_CREATION.md)
3. [API Standards](./API_STANDARDS.md)
4. [Collaboration Rules](./COLLABORATION_RULES.md)
5. [Agent Work Log](./AGENTS/)

## 🎯 Tujuan Framework

Framework ini dirancang untuk:
- Memungkinkan multiple AI Agent bekerja bersamaan tanpa konflik
- Struktur modular yang jelas dan terisolasi
- Dokumentasi yang mudah dipahami AI Agent
- Deployment yang mudah ke berbagai platform

## 🏗️ Struktur Project

```
BE/
├── src/
│   ├── core/              # Core framework (JANGAN DIUBAH tanpa koordinasi)
│   │   ├── config.ts      # Konfigurasi aplikasi
│   │   ├── logger.ts      # Logging system
│   │   ├── moduleLoader.ts # Auto-load modules
│   │   └── middleware/    # Global middleware
│   ├── modules/           # AREA KERJA AGENT (setiap agent buat folder sendiri)
│   │   └── [module-name]/ # Satu module = satu fitur
│   │       ├── routes.ts  # Route definitions
│   │       ├── controller.ts # Request handlers
│   │       ├── service.ts # Business logic
│   │       ├── types.ts   # TypeScript types
│   │       └── module.json # Module metadata
│   └── utils/             # Shared utilities
└── AI_DOCS/               # Dokumentasi untuk AI Agent
    └── AGENTS/            # Work log per agent
```

## 🤖 Aturan Kolaborasi AI Agent

### 1. Setiap Agent Bekerja di Module Terpisah
- Buat folder baru di `src/modules/[nama-module]`
- Jangan edit module agent lain tanpa koordinasi
- Core framework hanya diubah jika benar-benar perlu

### 2. Naming Convention
- Module: `kebab-case` (contoh: `user-management`)
- File: `camelCase.ts` (contoh: `userController.ts`)
- Class: `PascalCase` (contoh: `UserService`)
- Function: `camelCase` (contoh: `getUserById`)

### 3. Wajib Buat Dokumentasi
- Setiap module harus punya `module.json`
- Update work log di `AI_DOCS/AGENTS/[agent-name]/`
- Dokumentasikan API endpoints

### 4. Testing
- Test endpoint dengan `/health` terlebih dahulu
- Gunakan Postman/Thunder Client untuk test API
- Dokumentasikan hasil testing

## 🚀 Quick Start untuk AI Agent

### Membuat Module Baru

1. Copy folder `src/modules/example` sebagai template
2. Rename sesuai nama module Anda
3. Update `module.json` dengan informasi module
4. Implementasi routes, controller, service
5. Test endpoint
6. Update dokumentasi

### Contoh Workflow

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Run development
npm run dev

# 4. Test endpoint
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/example
```

## 📝 Template Module

Lihat `src/modules/example/` untuk template lengkap yang bisa di-copy.

## 🔍 Troubleshooting

Jika ada error:
1. Check logs di console
2. Pastikan .env sudah di-setup
3. Pastikan port tidak bentrok
4. Check module.json format

## 📞 Koordinasi Antar Agent

Jika perlu mengubah:
- Core framework → Diskusi dulu di work log
- Module agent lain → Minta izin/koordinasi
- Shared utilities → Dokumentasikan perubahan

---

**Dibuat untuk memudahkan kolaborasi AI Agent**
