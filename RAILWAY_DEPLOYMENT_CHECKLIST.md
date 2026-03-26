# Railway Deployment Checklist

## Current Error

```
Error: Failed to connect to MySQL: connect ECONNREFUSED ::1:3306
```

**Cause:** MySQL service belum ditambahkan ke Railway project atau environment variables belum ter-link.

## Fix: Add MySQL Service

### Step 1: Add MySQL to Railway Project

1. **Open Railway Dashboard**
   - Go to: https://railway.app
   - Login and open your project

2. **Add MySQL Service**
   - Click **"+ New"** button (top right)
   - Select **"Database"**
   - Click **"Add MySQL"**
   - Wait 30-60 seconds for provisioning

3. **Verify MySQL is Running**
   - MySQL service should show **green status**
   - Click on MySQL service
   - Go to **"Variables"** tab
   - Verify these variables exist:
     ```
     MYSQLHOST
     MYSQLPORT
     MYSQLUSER
     MYSQLPASSWORD
     MYSQLDATABASE
     MYSQL_URL
     ```

### Step 2: Link MySQL to Backend

Railway should auto-link services, but verify:

1. **Check Backend Service Variables**
   - Click on your backend service
   - Go to **"Variables"** tab
   - You should see MySQL variables listed
   - If NOT visible, they're still linked (Railway injects them at runtime)

2. **Verify Service Reference**
   - In Variables tab, look for **"Service Variables"** section
   - Should show MySQL service as reference

### Step 3: Redeploy Backend

After adding MySQL:

1. **Trigger Redeploy**
   - Click on backend service
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** on latest deployment
   
   OR
   
   - Make a small change and push:
     ```bash
     git commit --allow-empty -m "Trigger redeploy with MySQL"
     git push
     ```

2. **Watch Deployment Logs**
   - Go to **"Deployments"** tab
   - Click on new deployment
   - Watch logs in real-time

3. **Look for Success Messages**
   ```
   🔌 Connecting to MySQL...
   📍 Host: containers-us-west-xxx.railway.app:6379
   👤 User: root
   🗄️  Database: railway
   ✅ MySQL connection established
   ✅ Table created/verified: users
   ✅ Table created/verified: hp_cam_sessions
   ✅ Table created/verified: hp_cam_signals
   ✅ MySQL connected successfully!
   🚀 Server running successfully!
   ```

### Step 4: Verify Deployment

Test your endpoints:

```bash
# Replace with your Railway URL
RAILWAY_URL="https://your-app.up.railway.app"

# Health check
curl $RAILWAY_URL/health

# Expected: {"status":"ok","timestamp":"...","database":"connected"}

# Stats
curl $RAILWAY_URL/api/v1/hp-cam-session/stats

# Expected: {"status":"success","data":{"storage":"mysql","connected":true}}
```

## Troubleshooting

### Issue: MySQL Variables Not Showing

**Solution:**
1. Delete MySQL service
2. Re-add MySQL service
3. Wait for provisioning
4. Redeploy backend

### Issue: Still Getting ECONNREFUSED

**Check:**
1. MySQL service is running (green status)
2. Backend service is in same project as MySQL
3. Both services are in same environment (production/staging)

**Solution:**
```bash
# Check Railway CLI
railway status

# View all services
railway service

# Check variables
railway variables
```

### Issue: Access Denied

**Error:** `Access denied for user 'root'`

**Solution:**
1. Go to MySQL service → Variables
2. Copy exact values of MYSQLUSER and MYSQLPASSWORD
3. Manually add to backend service if needed
4. Redeploy

## Manual Variable Configuration (If Auto-Link Fails)

If Railway doesn't auto-link variables:

1. **Get MySQL Credentials**
   - Click MySQL service
   - Go to **"Variables"** tab
   - Copy all values

2. **Add to Backend Service**
   - Click backend service
   - Go to **"Variables"** tab
   - Click **"+ New Variable"**
   - Add each variable:
     ```
     MYSQLHOST=containers-us-west-xxx.railway.app
     MYSQLPORT=6379
     MYSQLUSER=root
     MYSQLPASSWORD=<from-mysql-service>
     MYSQLDATABASE=railway
     ```

3. **Redeploy**
   - Backend will automatically redeploy after adding variables

## Verification Commands

### Check Railway Services

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Check status
railway status

# View logs
railway logs

# Check variables
railway variables
```

### Check MySQL Connection

```bash
# Get MySQL connection string from Railway
# Go to MySQL service → Connect tab

# Test connection
mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD>

# List databases
SHOW DATABASES;

# Use railway database
USE railway;

# List tables (should be empty before first backend run)
SHOW TABLES;
```

## Expected Railway Project Structure

```
Your Railway Project
├── Backend Service (Node.js)
│   ├── Status: Running ✅
│   ├── Variables: Auto-linked from MySQL
│   └── Deployment: Latest successful
│
└── MySQL Service
    ├── Status: Running ✅
    ├── Variables: MYSQLHOST, MYSQLPORT, etc.
    └── Data: Tables will be created by backend
```

## Common Mistakes

❌ **Mistake 1:** MySQL service in different project
✅ **Fix:** Both services must be in same project

❌ **Mistake 2:** MySQL service not running
✅ **Fix:** Check MySQL service status, restart if needed

❌ **Mistake 3:** Backend deployed before MySQL added
✅ **Fix:** Redeploy backend after MySQL is ready

❌ **Mistake 4:** Using wrong environment
✅ **Fix:** Ensure both services in same environment

## Success Indicators

✅ MySQL service shows green status
✅ Backend service shows green status
✅ Health endpoint returns `"database":"connected"`
✅ Stats endpoint returns `"storage":"mysql"`
✅ Tables visible in MySQL Data tab
✅ No ECONNREFUSED errors in logs
✅ API endpoints working correctly

## Next Steps After Success

1. ✅ MySQL service running
2. ✅ Backend connected
3. ✅ Tables created
4. ⏳ Test all API endpoints
5. ⏳ Monitor logs for 24 hours
6. ⏳ Set up monitoring alerts
7. ⏳ Configure backup schedule
8. ⏳ Update frontend to use Railway URL

## Support

**Still having issues?**

1. **Check Railway Status**
   - https://status.railway.app

2. **Railway Discord**
   - https://discord.gg/railway
   - Ask in #help channel

3. **Railway Docs**
   - https://docs.railway.app/databases/mysql

4. **Provide These Details:**
   - Railway project ID
   - Deployment logs
   - MySQL service status
   - Backend service status
   - Error messages

## Quick Fix Summary

```bash
# 1. Add MySQL service in Railway dashboard
# 2. Wait for MySQL to be ready (green status)
# 3. Redeploy backend

# Using Railway CLI:
railway link
railway add mysql
railway up

# Or using Git:
git commit --allow-empty -m "Redeploy with MySQL"
git push
```

## Conclusion

The error `ECONNREFUSED ::1:3306` means backend is trying to connect to localhost because MySQL service hasn't been added to Railway yet.

**Solution:** Add MySQL service in Railway dashboard, then redeploy backend.

After MySQL is added, everything will work automatically! 🎉
