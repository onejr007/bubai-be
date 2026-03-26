# Deploy to Railway - Step by Step

## Prerequisites
- Railway account (https://railway.app)
- Git repository connected to Railway

## Step 1: Add MySQL Service to Railway

1. **Login to Railway**
   - Go to https://railway.app
   - Open your project

2. **Add MySQL Database**
   - Click **"New"** button in your project
   - Select **"Database"**
   - Choose **"Add MySQL"**
   - Wait for provisioning (30-60 seconds)

3. **Verify MySQL Service**
   - Click on MySQL service
   - Go to **"Variables"** tab
   - You should see:
     - `MYSQLHOST`
     - `MYSQLPORT`
     - `MYSQLUSER`
     - `MYSQLPASSWORD`
     - `MYSQLDATABASE`
     - `MYSQL_URL`

## Step 2: Link MySQL to Backend

Railway automatically links services in the same project. No manual configuration needed!

The backend will automatically receive all MySQL environment variables.

## Step 3: Deploy Backend

### Option A: Automatic Deployment (Recommended)

If your repo is connected to Railway:

```bash
git add .
git commit -m "Migrate to MySQL"
git push
```

Railway will automatically:
1. Detect changes
2. Build backend
3. Connect to MySQL
4. Deploy

### Option B: Manual Deployment

Using Railway CLI:

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up
```

## Step 4: Monitor Deployment

1. **Watch Build Logs**
   - Go to Railway project
   - Click on backend service
   - Go to **"Deployments"** tab
   - Click on latest deployment
   - Watch build logs

2. **Check for Success**
   Look for these logs:
   ```
   ✅ MySQL connection established
   ✅ Table created/verified: users
   ✅ Table created/verified: hp_cam_sessions
   ✅ Table created/verified: hp_cam_signals
   ✅ MySQL connected successfully!
   🚀 Server running successfully!
   ```

3. **Check for Errors**
   If you see errors:
   - `ECONNREFUSED` → MySQL service not running
   - `Access denied` → Wrong credentials
   - `Unknown database` → Database not created

## Step 5: Verify Deployment

### Test Health Endpoint

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T...",
  "database": "connected"
}
```

### Test Stats Endpoint

```bash
curl https://your-app.railway.app/api/v1/hp-cam-session/stats
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "storage": "mysql",
    "connected": true,
    "database": "MySQL Railway"
  }
}
```

### Test Create Session

```bash
curl -X POST https://your-app.railway.app/api/v1/hp-cam-session/create \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test-device-123"}'
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "sessionId": "uuid-here",
    "pairingCode": "123456",
    "expiresAt": "2026-03-26T..."
  }
}
```

## Step 6: Check Database Tables

1. **Open MySQL Console**
   - Go to Railway project
   - Click on MySQL service
   - Go to **"Data"** tab
   - You should see 3 tables:
     - `users`
     - `hp_cam_sessions`
     - `hp_cam_signals`

2. **Verify Table Structure**
   Click on each table to see columns and data.

## Troubleshooting

### Issue: Backend Won't Start

**Error:** `ECONNREFUSED ::1:3306`

**Cause:** MySQL service not added or not running

**Solution:**
1. Check MySQL service exists in Railway project
2. Verify MySQL service is running (green status)
3. Redeploy backend after MySQL is ready

### Issue: Access Denied

**Error:** `Access denied for user 'root'@'...'`

**Cause:** Wrong MySQL credentials

**Solution:**
1. Go to MySQL service → Variables tab
2. Verify `MYSQLUSER` and `MYSQLPASSWORD`
3. Check backend service has same variables
4. Redeploy if needed

### Issue: Unknown Database

**Error:** `Unknown database 'railway'`

**Cause:** Database not created

**Solution:**
1. MySQL service should auto-create database
2. Check MySQL service logs
3. Try restarting MySQL service
4. Contact Railway support if persists

### Issue: Tables Not Created

**Error:** No tables in database

**Cause:** Backend failed to initialize tables

**Solution:**
1. Check backend logs for SQL errors
2. Verify MySQL user has CREATE TABLE permission
3. Check database.ts initialization code
4. Redeploy backend

## Environment Variables

Railway automatically provides these from MySQL service:

```env
MYSQLHOST=containers-us-west-xxx.railway.app
MYSQLPORT=6379
MYSQLUSER=root
MYSQLPASSWORD=generated-password
MYSQLDATABASE=railway
MYSQL_URL=mysql://root:password@host:port/railway
```

**No manual configuration needed!**

## Post-Deployment Checklist

- [ ] MySQL service added and running
- [ ] Backend deployed successfully
- [ ] Health endpoint returns "connected"
- [ ] Stats endpoint shows "mysql"
- [ ] Tables created in database
- [ ] Create session works
- [ ] Join session works
- [ ] Send signal works
- [ ] No errors in logs

## Monitoring

### View Logs

```bash
# Using Railway CLI
railway logs

# Or in Railway dashboard
Project → Backend Service → Logs tab
```

### Set Up Alerts

1. Go to Railway project settings
2. Configure notifications for:
   - Deployment failures
   - Service crashes
   - High CPU/memory usage

### Monitor Metrics

1. Go to MySQL service
2. Check **"Metrics"** tab for:
   - CPU usage
   - Memory usage
   - Network traffic
   - Query performance

## Rollback

If deployment fails:

```bash
# Rollback to previous deployment
railway rollback

# Or in Railway dashboard
Deployments tab → Click previous deployment → Rollback
```

## Support

**Railway Support:**
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app
- Status: https://status.railway.app

**Common Issues:**
- Check Railway status page first
- Review deployment logs
- Test MySQL connection manually
- Contact Railway support with logs

## Success Criteria

✅ MySQL service running
✅ Backend deployed without errors
✅ Database tables created
✅ Health check returns "connected"
✅ All API endpoints working
✅ No timeout errors
✅ Stable performance

## Next Steps

After successful deployment:

1. Test all features thoroughly
2. Monitor logs for 24-48 hours
3. Set up monitoring alerts
4. Configure backup schedule
5. Update frontend to use new backend URL
6. Remove old Couchbase documentation

## Conclusion

Your backend is now running on Railway with MySQL! 🎉

No more Couchbase timeout issues. Enjoy fast and stable database connections!
