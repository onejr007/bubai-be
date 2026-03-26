# Railway MySQL Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Add MySQL to Railway Project

1. Open your Railway project: https://railway.app/project/your-project
2. Click **"New"** button
3. Select **"Database"**
4. Choose **"Add MySQL"**
5. Railway will provision MySQL automatically

### Step 2: Verify Environment Variables

Railway automatically sets these variables for your backend service:

```
MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
MYSQL_URL
```

**No manual configuration needed!** Railway links them automatically.

### Step 3: Deploy Backend

```bash
# Commit changes
git add .
git commit -m "Migrate to MySQL"

# Push to trigger deployment
git push
```

Railway will:
1. Build your backend
2. Connect to MySQL
3. Auto-create tables
4. Start serving

### Step 4: Verify Deployment

Check logs:
```bash
railway logs
```

Look for:
```
✅ MySQL connection established
✅ Table created/verified: users
✅ Table created/verified: hp_cam_sessions
✅ Table created/verified: hp_cam_signals
✅ MySQL connected successfully!
🚀 Server running successfully!
```

### Step 5: Test Endpoints

**Health Check:**
```bash
curl https://your-app.railway.app/health
```

**Stats:**
```bash
curl https://your-app.railway.app/api/v1/hp-cam-session/stats
```

Expected:
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

## Railway Dashboard

### View MySQL Database

1. Go to Railway project
2. Click on **MySQL service**
3. Go to **"Data"** tab
4. You can see tables and data

### Connect to MySQL

Railway provides connection details in **"Connect"** tab:

```bash
mysql -h containers-us-west-xxx.railway.app -P 6379 -u root -p
```

Or use MySQL Workbench:
- Host: `containers-us-west-xxx.railway.app`
- Port: `6379`
- User: `root`
- Password: (from Railway dashboard)

## Environment Variables Reference

Railway automatically provides:

| Variable | Description | Example |
|----------|-------------|---------|
| MYSQLHOST | MySQL host | containers-us-west-xxx.railway.app |
| MYSQLPORT | MySQL port | 6379 |
| MYSQLUSER | MySQL user | root |
| MYSQLPASSWORD | MySQL password | generated-password |
| MYSQLDATABASE | Database name | railway |
| MYSQL_URL | Full connection URL | mysql://root:pass@host:port/railway |

## Monitoring

### Check Logs
```bash
railway logs --service backend
```

### Check MySQL Metrics
1. Go to Railway project
2. Click MySQL service
3. View **"Metrics"** tab for:
   - CPU usage
   - Memory usage
   - Network traffic
   - Query performance

### Set Up Alerts
1. Go to Railway project settings
2. Configure notifications for:
   - Service down
   - High CPU/memory
   - Connection errors

## Backup & Recovery

### Automatic Backups
Railway provides automatic backups. Check:
1. MySQL service → **"Backups"** tab
2. View backup history
3. Restore if needed

### Manual Backup
```bash
# Export database
mysqldump -h $MYSQLHOST -P $MYSQLPORT -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE > backup.sql

# Import database
mysql -h $MYSQLHOST -P $MYSQLPORT -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < backup.sql
```

## Troubleshooting

### Connection Failed

**Check:**
```bash
railway logs --service backend
```

**Common issues:**
1. MySQL service not running → Start in Railway dashboard
2. Wrong credentials → Verify environment variables
3. Network issue → Check Railway status

### Tables Not Created

**Check logs for:**
```
❌ Failed to initialize tables
```

**Solution:**
1. Check MySQL user has CREATE TABLE permission
2. Verify database exists
3. Check SQL syntax in database.ts

### Slow Queries

**Check:**
1. Railway MySQL metrics
2. Add indexes if needed
3. Optimize queries

## Cost

Railway MySQL pricing:
- **Hobby Plan:** $5/month (500MB storage)
- **Pro Plan:** $20/month (8GB storage)
- **Team Plan:** Custom pricing

Current usage visible in Railway dashboard.

## Migration from Couchbase

If migrating from Couchbase:

1. ✅ Code already migrated
2. ✅ MySQL service added
3. ✅ Tables auto-created
4. ⚠️ Data migration needed (if any existing data)

**Data migration:**
- Export from Couchbase
- Transform to SQL INSERT statements
- Import to MySQL

## Best Practices

1. **Use Connection Pooling** ✅ (Already implemented)
2. **Index Important Columns** ✅ (Already added)
3. **Monitor Query Performance** (Set up alerts)
4. **Regular Backups** (Railway automatic)
5. **Cleanup Expired Data** (Run cleanup job)

## Support

**Railway Support:**
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app
- Status: https://status.railway.app

**MySQL Issues:**
- Check Railway logs first
- Test connection manually
- Review error messages
- Contact Railway support

## Next Steps

1. ✅ MySQL service added
2. ✅ Backend deployed
3. ✅ Tables created
4. ⏳ Monitor for 24 hours
5. ⏳ Test all features
6. ⏳ Set up monitoring alerts
7. ⏳ Configure backups schedule

## Conclusion

Railway MySQL setup is complete! Your backend is now using:
- ✅ Fast and stable MySQL
- ✅ Automatic environment variables
- ✅ Auto-created tables
- ✅ Connection pooling
- ✅ Ready for production

No more Couchbase timeout issues! 🎉
