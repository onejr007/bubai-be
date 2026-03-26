# Free Deployment Options for Backend

Firebase Hosting (gratis) hanya untuk static files. Untuk Node.js backend, gunakan platform gratis berikut:

## 🎯 Recommended: Render.com (FREE)

### Keunggulan:
- ✅ Free tier permanent
- ✅ Auto-deploy from Git
- ✅ Custom domains
- ✅ Environment variables
- ✅ Automatic HTTPS
- ✅ 750 hours/month free

### Setup Render:

1. **Sign up:** https://render.com

2. **Create New Web Service:**
   - Connect GitHub repository
   - Select branch: `main`
   - Root directory: `BE`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

3. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   COUCHBASE_CONNECTION_STRING=couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
   COUCHBASE_USERNAME=chilooks91@gmail.com
   COUCHBASE_PASSWORD=Mario!23
   COUCHBASE_BUCKET=ai-collaborative
   ALLOWED_ORIGINS=https://bub-ai.web.app
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (~5 minutes)
   - Get URL: `https://your-app.onrender.com`

## 🚂 Alternative: Railway.app (FREE)

### Keunggulan:
- ✅ $5 free credit/month
- ✅ Very fast deployment
- ✅ Auto-deploy from Git
- ✅ Easy environment setup

### Setup Railway:

1. **Sign up:** https://railway.app

2. **New Project:**
   ```bash
   npm i -g @railway/cli
   railway login
   cd BE
   railway init
   railway up
   ```

3. **Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set COUCHBASE_CONNECTION_STRING=couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
   railway variables set COUCHBASE_USERNAME=chilooks91@gmail.com
   railway variables set COUCHBASE_PASSWORD=Mario!23
   railway variables set COUCHBASE_BUCKET=ai-collaborative
   railway variables set ALLOWED_ORIGINS=https://bub-ai.web.app
   ```

4. **Get URL:**
   - Railway will provide: `https://your-app.up.railway.app`

## 🔷 Alternative: Vercel (FREE)

### Keunggulan:
- ✅ Unlimited free deployments
- ✅ Serverless functions
- ✅ Very fast CDN

### Setup Vercel:

1. **Install CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd BE
   vercel
   ```

3. **Configure:**
   - Add environment variables in Vercel dashboard
   - Vercel will auto-detect Node.js

## 🐙 Alternative: Cyclic.sh (FREE)

### Keunggulan:
- ✅ Completely free
- ✅ No credit card required
- ✅ Auto-deploy from GitHub

### Setup Cyclic:

1. **Sign up:** https://cyclic.sh
2. **Connect GitHub repo**
3. **Select BE folder**
4. **Add environment variables**
5. **Deploy**

## 📋 Comparison

| Platform | Free Tier | Auto-Deploy | Custom Domain | Ease of Use |
|----------|-----------|-------------|---------------|-------------|
| Render | 750h/month | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Railway | $5 credit | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| Vercel | Unlimited | ✅ | ✅ | ⭐⭐⭐⭐ |
| Cyclic | Unlimited | ✅ | ✅ | ⭐⭐⭐⭐ |

## 🎯 Recommended Choice: Render.com

Paling mudah dan reliable untuk Node.js backend gratis.

## 📝 After Deployment

1. **Update Frontend .env.production:**
   ```env
   VITE_API_URL=https://your-app.onrender.com
   ```

2. **Update CORS in Backend:**
   ```env
   ALLOWED_ORIGINS=https://bub-ai.web.app,http://localhost:5173
   ```

3. **Test Endpoints:**
   ```bash
   curl https://your-app.onrender.com/health
   curl https://your-app.onrender.com/api-docs
   ```

4. **Deploy Frontend:**
   ```bash
   cd FE
   npm run build
   firebase deploy
   ```

## 🔧 Troubleshooting

### Cold Start (Render Free Tier)
- Free tier sleeps after 15 minutes inactivity
- First request takes ~30 seconds to wake up
- Solution: Use cron job to ping every 10 minutes

### Environment Variables Not Working
- Check spelling
- Restart service after adding variables
- Check logs for errors

### CORS Errors
- Verify ALLOWED_ORIGINS includes frontend URL
- Check frontend is using correct backend URL

## 💡 Pro Tips

1. **Use Render for production** - Most reliable free tier
2. **Use Railway for development** - Faster deployments
3. **Keep Firebase for frontend** - Perfect for React apps
4. **Monitor logs** - All platforms have good logging
5. **Set up alerts** - Get notified if service goes down

---

**Recommendation:** Deploy to Render.com for best free experience! 🚀
