# Deploy Backend ke Railway.app

## 🚂 Railway Deployment Guide

Railway sangat mudah dan cepat untuk deploy Node.js backend!

## 🎯 Keunggulan Railway

- ✅ $5 free credit per bulan
- ✅ Deploy sangat cepat (~2 menit)
- ✅ Auto-deploy dari GitHub
- ✅ Environment variables mudah
- ✅ Custom domain gratis
- ✅ Automatic HTTPS

## 📋 Method 1: Deploy via Dashboard (Recommended)

### Step 1: Sign Up

1. Go to: https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway

### Step 2: New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Node.js

### Step 3: Configure

Railway akan auto-detect `package.json` dan setup:
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Root Directory: Pilih `BE` folder

### Step 4: Environment Variables

Click "Variables" tab, add:

```
NODE_ENV=production
PORT=3000
COUCHBASE_CONNECTION_STRING=couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
COUCHBASE_USERNAME=chilooks91@gmail.com
COUCHBASE_PASSWORD=Mario!23
COUCHBASE_BUCKET=ai-collaborative
ALLOWED_ORIGINS=https://bub-ai.web.app
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait ~2-3 minutes
3. Get URL: `https://your-app.up.railway.app`

### Step 6: Access Swagger

```
https://your-app.up.railway.app/api-docs
```

## 📋 Method 2: Deploy via CLI (Faster)

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login

```bash
railway login
```

Browser akan terbuka, authorize Railway.

### Step 3: Initialize Project

```bash
cd BE
railway init
```

Pilih:
- Create new project
- Enter project name: `ai-collaborative-backend`

### Step 4: Add Environment Variables

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set COUCHBASE_CONNECTION_STRING=couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
railway variables set COUCHBASE_USERNAME=chilooks91@gmail.com
railway variables set COUCHBASE_PASSWORD=Mario!23
railway variables set COUCHBASE_BUCKET=ai-collaborative
railway variables set ALLOWED_ORIGINS=https://bub-ai.web.app
```

### Step 5: Deploy

```bash
railway up
```

Wait ~2 minutes, done!

### Step 6: Get URL

```bash
railway domain
```

Or check dashboard: https://railway.app/dashboard

## 🔧 Configuration Files

Railway auto-detects from `package.json`:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc && tsc-alias"
  }
}
```

No additional config needed!

## 📊 Monitoring

### View Logs

**Dashboard:**
- Go to https://railway.app/dashboard
- Click your project
- Click "Deployments" tab
- View logs in real-time

**CLI:**
```bash
railway logs
```

### Check Status

```bash
railway status
```

### Restart Service

```bash
railway restart
```

## 🌐 Custom Domain (Optional)

### Add Custom Domain

1. Go to Railway dashboard
2. Click "Settings" tab
3. Scroll to "Domains"
4. Click "Add Domain"
5. Enter your domain
6. Update DNS records

## 💰 Pricing

### Free Tier
- $5 credit per month
- ~500 hours of usage
- Perfect for development/demo

### Usage Tracking
```bash
railway usage
```

Or check dashboard for real-time usage.

## 🧪 Testing Deployment

### 1. Test Health Endpoint

```bash
curl https://your-app.up.railway.app/health
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T...",
  "database": "connected"
}
```

### 2. Test Swagger UI

Open browser:
```
https://your-app.up.railway.app/api-docs
```

### 3. Test API Endpoints

```bash
# Create user
curl -X POST https://your-app.up.railway.app/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get users
curl https://your-app.up.railway.app/api/v1/users
```

## 🔄 Auto-Deploy from GitHub

### Setup Auto-Deploy

1. Railway dashboard → Settings
2. Enable "Auto-deploy"
3. Select branch: `main`

Now every push to `main` will auto-deploy!

### Trigger Manual Deploy

```bash
railway up
```

Or via dashboard: Click "Deploy" button

## 🔧 Troubleshooting

### Build Failed

**Check logs:**
```bash
railway logs
```

**Common issues:**
- Missing dependencies: Run `npm install` locally first
- TypeScript errors: Run `npm run build` locally
- Wrong directory: Make sure you're in `BE` folder

### Environment Variables Not Working

**Check variables:**
```bash
railway variables
```

**Update variable:**
```bash
railway variables set KEY=value
```

### Port Issues

Railway automatically assigns PORT. Make sure your code uses:
```typescript
const port = process.env.PORT || 3000;
```

### Database Connection Failed

**Check credentials:**
- Verify Couchbase connection string
- Check username/password
- Test connection locally first

## 📝 Update Frontend

After deployment, update frontend `.env.production`:

```env
VITE_API_URL=https://your-app.up.railway.app
VITE_APP_URL=https://bub-ai.web.app
```

Then redeploy frontend:
```bash
cd FE
npm run build
firebase deploy --only hosting
```

## 🎯 Quick Commands Reference

```bash
# Login
railway login

# Initialize
railway init

# Deploy
railway up

# View logs
railway logs

# Check status
railway status

# Get domain
railway domain

# Set variable
railway variables set KEY=value

# View variables
railway variables

# Restart
railway restart

# Open dashboard
railway open
```

## 💡 Pro Tips

1. **Use CLI for faster deployment** - No need to use dashboard
2. **Enable auto-deploy** - Push to GitHub = auto-deploy
3. **Monitor usage** - Check dashboard regularly
4. **Use environment variables** - Never hardcode secrets
5. **Test locally first** - Run `npm run build` before deploying

## 🚀 Expected Timeline

- Sign up: 1 minute
- Setup project: 1 minute
- Configure variables: 2 minutes
- Deploy: 2-3 minutes
- **Total: ~5-7 minutes**

## 📞 Support

- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

---

**Railway is the fastest way to deploy your backend!** 🚂💨
