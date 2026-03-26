# Quick Fix: ECONNREFUSED Error

## Problem
```
Error: Failed to connect to MySQL: connect ECONNREFUSED ::1:3306
```

## Root Cause
MySQL service belum ditambahkan ke Railway project.

## Solution (2 Minutes)

### 1. Add MySQL Service
1. Open Railway dashboard: https://railway.app
2. Click **"+ New"**
3. Select **"Database"** → **"Add MySQL"**
4. Wait 30-60 seconds

### 2. Redeploy Backend
```bash
git commit --allow-empty -m "Redeploy with MySQL"
git push
```

OR click **"Redeploy"** in Railway dashboard.

### 3. Verify
```bash
curl https://your-app.railway.app/health
```

Expected: `"database":"connected"`

## That's It!

Railway will automatically:
- ✅ Set MySQL environment variables
- ✅ Link MySQL to backend
- ✅ Connect backend to MySQL
- ✅ Create database tables

No manual configuration needed!

## Still Not Working?

Check:
1. MySQL service status is **green** ✅
2. Backend redeployed **after** MySQL added
3. Both services in **same Railway project**

## Need Help?

See detailed guide: `RAILWAY_DEPLOYMENT_CHECKLIST.md`
