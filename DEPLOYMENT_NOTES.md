# Backend Deployment Notes - HP Camera Session

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Free Tier)

**Keuntungan:**
- ✅ Free tier available
- ✅ Auto-deploy from Git
- ✅ Built-in PostgreSQL/Redis (jika perlu)
- ✅ Easy environment variables

**Steps:**
1. Push code ke GitHub
2. Connect Railway ke repo
3. Set environment variables (opsional untuk Couchbase)
4. Deploy!

**Environment Variables (Opsional):**
```
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.com
```

### Option 2: Render (Free Tier)

**Steps:**
1. Push code ke GitHub
2. Create new Web Service di Render
3. Connect repo
4. Build command: `npm install && npm run build`
5. Start command: `npm start`

### Option 3: Vercel (Serverless)

**Note:** Sudah ada `vercel.json` di project

**Steps:**
```bash
npm install -g vercel
vercel
```

### Option 4: Firebase Hosting + Cloud Run

**Note:** Sudah ada `firebase.json` di project

**Steps:**
```bash
firebase deploy
```

## 🔧 Environment Variables

### Minimal (In-Memory Mode):
```env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.com
```

### With Couchbase (Production):
```env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.com
COUCHBASE_CONNECTION_STRING=couchbases://your-cluster.cloud.couchbase.com
COUCHBASE_USERNAME=your-username
COUCHBASE_PASSWORD=your-password
COUCHBASE_BUCKET=your-bucket
```

## 📋 Pre-Deployment Checklist

- [ ] Update `ALLOWED_ORIGINS` dengan URL frontend production
- [ ] Set `NODE_ENV=production`
- [ ] Test build locally: `npm run build`
- [ ] Test start locally: `npm start`
- [ ] Verify health endpoint: `/health`
- [ ] Verify API docs: `/api-docs`
- [ ] (Optional) Configure Couchbase credentials

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://your-backend.com/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "disconnected"  // or "connected"
}
```

### 2. Storage Stats
```bash
curl https://your-backend.com/api/v1/hp-cam-session/stats
```

Expected:
```json
{
  "status": "success",
  "data": {
    "storage": "memory",
    "sessions": 0,
    "signals": 0,
    "activeSessions": 0
  }
}
```

### 3. Create Session Test
```bash
curl -X POST https://your-backend.com/api/v1/hp-cam-session/create \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test-device"}'
```

### 4. API Documentation
```
https://your-backend.com/api-docs
```

## ⚠️ Important Notes

### In-Memory Mode (Default):
- Sessions akan hilang saat dyno/container restart
- Cocok untuk testing dan low-traffic apps
- Tidak perlu database setup

### Scaling Considerations:
- In-memory mode: Single instance only
- Untuk multiple instances: Gunakan Couchbase atau Redis
- Untuk high traffic: Setup Couchbase cluster

### CORS Configuration:
Pastikan `ALLOWED_ORIGINS` include:
- Frontend production URL
- Frontend staging URL (jika ada)
- Localhost untuk development

Example:
```env
ALLOWED_ORIGINS=https://myapp.com,https://staging.myapp.com,http://localhost:5173
```

## 🔒 Security Checklist

- [ ] HTTPS enabled (auto di Railway/Render/Vercel)
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] No sensitive data in code
- [ ] Helmet middleware enabled (sudah ada)
- [ ] Rate limiting (consider adding)

## 📊 Monitoring

### Logs
```bash
# Railway
railway logs

# Render
# Check dashboard

# Vercel
vercel logs
```

### Metrics to Monitor:
- Response time
- Error rate
- Active sessions count
- Memory usage (in-memory mode)

### Health Check Endpoint:
Setup monitoring service (UptimeRobot, etc) untuk ping:
```
https://your-backend.com/health
```

## 🔄 CI/CD

### GitHub Actions Example:
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'BE/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
```

## 🆘 Troubleshooting

### Build Fails:
```bash
# Test locally
cd BE
npm install
npm run build
```

### App Crashes on Start:
- Check logs
- Verify `package.json` start script
- Ensure all dependencies installed

### CORS Errors:
- Update `ALLOWED_ORIGINS` environment variable
- Include protocol (http/https)
- No trailing slash

### Session Not Working:
- Check `/health` endpoint
- Check `/stats` endpoint
- Verify API is accessible

## 📱 Frontend Configuration

Update frontend API URL:

**Development:**
```typescript
// FE/src/config/api.ts
const API_URL = 'http://localhost:3000/api/v1';
```

**Production:**
```typescript
// FE/src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend.com/api/v1';
```

**Environment Variable:**
```env
# FE/.env.production
VITE_API_URL=https://your-backend.com/api/v1
```

## 🎯 Performance Tips

### In-Memory Mode:
- Monitor memory usage
- Consider session TTL (default: 5 minutes)
- Cleanup runs every 1 minute

### Couchbase Mode:
- Use connection pooling (already configured)
- Monitor query performance
- Setup indexes for pairing code lookup

## 📚 Additional Resources

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Couchbase Cloud: https://cloud.couchbase.com

## ✅ Deployment Complete Checklist

- [ ] Backend deployed successfully
- [ ] Health check passing
- [ ] API docs accessible
- [ ] Session create/join working
- [ ] CORS configured for frontend
- [ ] Environment variables set
- [ ] Monitoring setup
- [ ] Frontend updated with backend URL
- [ ] End-to-end test passed

---

**Ready to deploy!** 🚀

Choose your platform and follow the steps above.
