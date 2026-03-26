# Deployment Guide

## ⚠️ Important: Firebase Hosting Only

Firebase Hosting (free tier) hanya untuk static files. Untuk Node.js backend, gunakan platform gratis lainnya.

**Firebase Hosting:** https://bub-ai-be.web.app (static info page only)

## 🎯 Recommended: Render.com (FREE)

**Best choice untuk Node.js backend gratis!**

### Quick Deploy to Render:

1. **Sign up:** https://render.com

2. **New Web Service:**
   - Connect GitHub repo
   - Root directory: `BE`
   - Build: `npm install && npm run build`
   - Start: `npm start`

3. **Environment Variables:**
   ```
   NODE_ENV=production
   COUCHBASE_CONNECTION_STRING=couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
   COUCHBASE_USERNAME=chilooks91@gmail.com
   COUCHBASE_PASSWORD=Mario!23
   COUCHBASE_BUCKET=ai-collaborative
   ALLOWED_ORIGINS=https://bub-ai.web.app
   ```

4. **Deploy!**
   - Get URL: `https://your-app.onrender.com`
   - Auto-deploy on Git push

### Using render.yaml (Recommended)

File `render.yaml` sudah tersedia. Render akan auto-detect dan setup semuanya.

## 🚀 Free Platform Options

Framework ini mudah di-deploy ke berbagai platform gratis:

### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd BE
npm run build
vercel
```

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/index.js"
    }
  ]
}
```

### 2. Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login & deploy
railway login
railway init
railway up
```

### 3. Render

1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables

### 4. Heroku

```bash
heroku create
git push heroku main
```

### 5. VPS with PM2

```bash
# Build
npm run build

# Install PM2
npm i -g pm2

# Start
pm2 start dist/index.js --name api

# Save
pm2 save
pm2 startup
```

## 🔧 Environment Variables

Set these on your platform:

```
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://your-frontend.com
```

## ✅ Pre-Deployment Checklist

- [ ] `npm run build` berhasil
- [ ] Environment variables configured
- [ ] CORS origins updated
- [ ] Database connected (if any)
- [ ] Health check working

## 🧪 Test Deployment

```bash
curl https://your-api.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T..."
}
```
