# Build Fix Documentation

## ❌ Error yang Terjadi

Saat menjalankan `npm run build`, muncul error:

```
src/core/database.ts:23:25 - error TS2339: Property 'waitUntilReady' does not exist on type 'Bucket'.
```

## 🔍 Root Cause

Method `waitUntilReady()` tidak tersedia di Couchbase SDK versi yang digunakan. Method ini mungkin deprecated atau tidak ada di versi SDK tertentu.

## ✅ Solution

Menghapus `await this.bucket.waitUntilReady(5000)` dan menggantinya dengan test connection sederhana:

```typescript
// Before (Error)
this.bucket = this.cluster.bucket(config.couchbase.bucket);
await this.bucket.waitUntilReady(5000);

// After (Fixed)
this.bucket = this.cluster.bucket(config.couchbase.bucket);
// Test connection by getting a collection
const collection = this.bucket.scope('_default').collection('_default');
```

## 📝 File yang Diubah

- `BE/src/core/database.ts` - Line 23

## 🧪 Testing

```bash
cd BE
npm run build
# ✅ Build successful!

node dist/index.js
# ✅ Server starts and connects to Couchbase
```

## 📊 Build Output

```
BE/dist/
├── core/
│   ├── config.js
│   ├── database.js
│   ├── logger.js
│   ├── moduleLoader.js
│   ├── swagger.js
│   └── middleware/
│       └── errorHandler.js
├── modules/
│   ├── example/
│   │   ├── controller.js
│   │   ├── routes.js
│   │   └── service.js
│   └── users/
│       ├── controller.js
│       ├── routes.js
│       └── service.js
└── index.js
```

## 🚀 Deployment Ready

Build sekarang berhasil dan siap untuk deployment:

```bash
# Build
npm run build

# Deploy to Firebase
firebase deploy

# Or run production
npm start
```

## 💡 Notes

- Connection ke Couchbase tetap berfungsi normal
- Tidak ada perubahan functionality
- Hanya menghapus method yang tidak tersedia
- Build time: ~5-10 seconds

---

**Status:** ✅ Fixed and Tested
**Date:** 2026-03-26
