# Railway Environment Variables Setup

## ❌ Error yang Terjadi

```
error: ❌ COUCHBASE CREDENTIALS REQUIRED! 
Please configure COUCHBASE_CONNECTION_STRING and COUCHBASE_USERNAME in .env
```

## ✅ Solusi: Set Environment Variables di Railway

### Cara 1: Via Railway Dashboard (Recommended)

1. **Buka Railway Dashboard**
   - Go to: https://railway.app
   - Login ke account Anda
   - Pilih project: `bub-ai` (atau nama project BE Anda)

2. **Masuk ke Settings**
   - Click pada service backend Anda
   - Click tab **"Variables"** atau **"Settings"**

3. **Add Environment Variables**
   Click **"New Variable"** dan tambahkan satu per satu:

   ```
   Variable Name: PORT
   Value: 3000
   ```

   ```
   Variable Name: NODE_ENV
   Value: production
   ```

   ```
   Variable Name: ALLOWED_ORIGINS
   Value: https://bub-ai.up.railway.app,https://bub-ai.web.app,http://localhost:5173
   ```

   ```
   Variable Name: API_PREFIX
   Value: /api/v1
   ```

   ```
   Variable Name: COUCHBASE_CONNECTION_STRING
   Value: couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
   ```

   ```
   Variable Name: COUCHBASE_USERNAME
   Value: bubai-be
   ```

   ```
   Variable Name: COUCHBASE_PASSWORD
   Value: Mario!23
   ```

   ```
   Variable Name: COUCHBASE_BUCKET
   Value: ai-collaborative
   ```

4. **Deploy Ulang**
   - Railway akan otomatis redeploy setelah variables ditambahkan
   - Atau click **"Deploy"** manual

### Cara 2: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Set environment variables
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set ALLOWED_ORIGINS="https://bub-ai.up.railway.app,https://bub-ai.web.app,http://localhost:5173"
railway variables set API_PREFIX=/api/v1
railway variables set COUCHBASE_CONNECTION_STRING="couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com"
railway variables set COUCHBASE_USERNAME=bubai-be
railway variables set COUCHBASE_PASSWORD="Mario!23"
railway variables set COUCHBASE_BUCKET=ai-collaborative

# Deploy
railway up
```

### Cara 3: Bulk Import (Fastest)

1. **Copy Environment Variables**
   ```env
   PORT=3000
   NODE_ENV=production
   ALLOWED_ORIGINS=https://bub-ai.up.railway.app,https://bub-ai.web.app,http://localhost:5173
   API_PREFIX=/api/v1
   COUCHBASE_CONNECTION_STRING=couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
   COUCHBASE_USERNAME=bubai-be
   COUCHBASE_PASSWORD=Mario!23
   COUCHBASE_BUCKET=ai-collaborative
   ```

2. **Paste di Railway**
   - Go to Railway Dashboard → Your Service → Variables
   - Click **"Raw Editor"** atau **"Bulk Import"**
   - Paste semua variables di atas
   - Click **"Save"**

## 🧪 Verifikasi Setelah Deploy

### 1. Check Logs
```
Railway Dashboard → Your Service → Deployments → View Logs
```

Expected logs:
```
info: 🚀 Starting server initialization...
info: 🔌 Connecting to Couchbase...
info: 📍 Connection String: couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
info: 👤 Username: bubai-be
info: 🗄️  Bucket: ai-collaborative
info: ✅ Cluster connected, accessing bucket...
info: ✅ Collection accessible
info: ✅ Couchbase connected successfully!
info: 🎉 Database ready for operations
info: 📦 Loading modules...
info: ✅ Modules loaded successfully
info: 🚀 Server running successfully!
```

### 2. Test Health Endpoint
```bash
curl https://bub-ai.up.railway.app/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T...",
  "database": "connected"
}
```

### 3. Test Database Stats
```bash
curl https://bub-ai.up.railway.app/api/v1/hp-cam-session/stats
```

Expected:
```json
{
  "status": "success",
  "data": {
    "storage": "couchbase",
    "connected": true,
    "bucket": "ai-collaborative"
  }
}
```

## 📋 Checklist Environment Variables

Pastikan semua variables ini sudah di-set di Railway:

- [ ] `PORT` = 3000
- [ ] `NODE_ENV` = production
- [ ] `ALLOWED_ORIGINS` = https://bub-ai.up.railway.app,https://bub-ai.web.app,http://localhost:5173
- [ ] `API_PREFIX` = /api/v1
- [ ] `COUCHBASE_CONNECTION_STRING` = couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
- [ ] `COUCHBASE_USERNAME` = bubai-be
- [ ] `COUCHBASE_PASSWORD` = Mario!23
- [ ] `COUCHBASE_BUCKET` = ai-collaborative

## 🔧 Troubleshooting

### Error: "COUCHBASE CREDENTIALS REQUIRED"
**Cause:** Environment variables belum di-set di Railway

**Solution:** Set variables menggunakan salah satu cara di atas

### Error: "Connection timeout"
**Cause:** Couchbase connection string salah atau network issue

**Solution:** 
- Verify connection string benar
- Check Couchbase cluster status
- Pastikan Railway bisa akses Couchbase Cloud

### Error: "Authentication failed"
**Cause:** Username atau password salah

**Solution:**
- Verify credentials di Couchbase Cloud
- Update environment variables di Railway

### Server Keeps Restarting
**Cause:** Database connection gagal, server exit

**Solution:**
- Check logs untuk error detail
- Verify semua environment variables
- Test Couchbase connection dari local

## 📸 Screenshot Guide

### Railway Dashboard - Variables Tab
```
1. Click your service
2. Click "Variables" tab
3. Click "New Variable"
4. Enter name and value
5. Click "Add"
6. Repeat for all variables
7. Railway will auto-redeploy
```

### Railway Dashboard - Raw Editor
```
1. Click your service
2. Click "Variables" tab
3. Click "Raw Editor" button
4. Paste all variables (KEY=VALUE format)
5. Click "Save"
6. Railway will auto-redeploy
```

## ✅ Success Indicators

Setelah environment variables di-set dengan benar, Anda akan melihat:

1. **Logs menunjukkan:**
   - ✅ Couchbase connected successfully
   - ✅ Database ready for operations
   - ✅ Server running successfully

2. **Health endpoint returns:**
   - `"database": "connected"`

3. **Stats endpoint returns:**
   - `"storage": "couchbase"`
   - `"connected": true`

4. **No more restarts**
   - Server berjalan stabil
   - No error logs

## 🚀 Next Steps After Fix

1. ✅ Verify backend running
2. ✅ Test all endpoints
3. ✅ Deploy frontend
4. ✅ Test end-to-end integration

---

**IMPORTANT:** Jangan lupa set environment variables di Railway sebelum deploy!
