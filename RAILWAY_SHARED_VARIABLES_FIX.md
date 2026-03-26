# Railway Shared Variables Fix

## Problem

Environment variables menggunakan Railway reference syntax `${{shared.VARIABLE}}` tapi tidak ter-resolve, menyebabkan aplikasi connect ke `localhost` instead of actual MySQL host.

## Understanding Railway Shared Variables

Railway's reference syntax `${{shared.VARIABLE}}` akan di-**resolve oleh Railway** sebelum aplikasi berjalan. Aplikasi Node.js tetap menggunakan `process.env.VARIABLE` biasa.

**Example:**
```env
# Di Railway Variables
MYSQLHOST=${{shared.MYSQLHOST}}

# Di aplikasi Node.js
const host = process.env.MYSQLHOST; // Akan berisi actual value, bukan "${{shared.MYSQLHOST}}"
```

## Why References Not Resolving

Railway references tidak ter-resolve jika:

1. **MySQL service belum fully ready**
   - Status masih provisioning
   - Shared variables belum generated

2. **Variables belum di-share dengan benar**
   - Shared variables tidak visible di target service
   - Typo dalam reference syntax

3. **Deployment timing issue**
   - Backend deployed sebelum MySQL ready
   - Perlu redeploy setelah MySQL provisioned

## Solution Steps

### Step 1: Verify MySQL Service

1. **Check MySQL Status**
   - Go to Railway project
   - Click MySQL service
   - Status should be **green/running**

2. **Check Shared Variables**
   - Click MySQL service
   - Go to **"Variables"** tab
   - Verify these variables exist:
     ```
     MYSQLHOST
     MYSQLPORT
     MYSQLUSER
     MYSQLPASSWORD
     MYSQLDATABASE
     ```

### Step 2: Verify Backend Variables

1. **Check Backend Service**
   - Click backend service
   - Go to **"Variables"** tab

2. **Verify Reference Syntax**
   Your variables should look like:
   ```env
   MYSQLHOST=${{shared.MYSQLHOST}}
   MYSQLPORT=${{shared.MYSQLPORT}}
   MYSQLUSER=${{shared.MYSQLUSER}}
   MYSQLPASSWORD=${{shared.MYSQLPASSWORD}}
   MYSQLDATABASE=${{shared.MYSQLDATABASE}}
   ```

3. **Check for Typos**
   - Namespace must be exactly `shared` (lowercase)
   - Variable names must match exactly (case-sensitive)
   - Syntax: `${{namespace.VARIABLE}}` (no spaces)

### Step 3: Force Redeploy

After verifying variables:

1. **Trigger Redeploy**
   ```bash
   git commit --allow-empty -m "Force redeploy to resolve shared variables"
   git push
   ```

2. **Or use Railway Dashboard**
   - Go to backend service
   - Deployments tab
   - Click "Redeploy" on latest deployment

### Step 4: Check Deployment Logs

Watch for debug output:

```
🔍 Environment check:
  - MYSQLHOST: containers-us-west-xxx.railway.app  ✅ (should NOT be "NOT SET")
  - MYSQLPORT: 6379  ✅
  - MYSQLUSER: root  ✅
  - MYSQLDATABASE: railway  ✅
  - MYSQLPASSWORD: ***SET***  ✅
```

**If you see "NOT SET":**
- Railway references not resolved
- Check MySQL service is running
- Verify variable names match exactly
- Try redeploying

## Alternative: Use Service References

Instead of shared variables, you can reference MySQL service directly:

```env
# Instead of:
MYSQLHOST=${{shared.MYSQLHOST}}

# Use:
MYSQLHOST=${{MySQL.MYSQLHOST}}
```

Where `MySQL` is the name of your MySQL service in Railway.

## Alternative: Manual Variables

If shared variables still don't work, manually copy values:

1. **Get MySQL Credentials**
   - Click MySQL service
   - Go to Variables tab
   - Copy each value

2. **Add to Backend**
   - Click backend service
   - Go to Variables tab
   - Add as plain text (not references):
     ```env
     MYSQLHOST=containers-us-west-xxx.railway.app
     MYSQLPORT=6379
     MYSQLUSER=root
     MYSQLPASSWORD=actual-password-here
     MYSQLDATABASE=railway
     ```

3. **Redeploy**
   - Backend will auto-redeploy after adding variables

## Debugging with Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link
railway login
railway link

# Check variables
railway variables

# Check if references are resolved
railway run env | grep MYSQL

# Should show actual values, not ${{...}}
```

## Common Issues

### Issue 1: Variables Show as "${{shared.VARIABLE}}"

**Symptom:** In logs, you see literal `${{shared.MYSQLHOST}}` instead of actual value.

**Cause:** Railway didn't resolve the reference.

**Fix:**
1. Check MySQL service is running
2. Verify variable exists in MySQL service
3. Check spelling/case matches exactly
4. Redeploy backend

### Issue 2: Some Variables Resolve, Others Don't

**Symptom:** `MYSQLDATABASE` works but `MYSQLHOST` doesn't.

**Cause:** Typo or missing variable in source service.

**Fix:**
1. Compare variable names character-by-character
2. Check for extra spaces
3. Verify all variables exist in MySQL service

### Issue 3: Works Locally, Fails on Railway

**Symptom:** Local `.env` works, Railway doesn't.

**Cause:** Railway uses different variable resolution.

**Fix:**
1. Don't use `.env` file in Railway
2. Set all variables in Railway dashboard
3. Use Railway's reference syntax

## Verification Checklist

- [ ] MySQL service status is green
- [ ] MySQL service has all required variables
- [ ] Backend variables use correct reference syntax
- [ ] No typos in variable names
- [ ] Backend redeployed after MySQL ready
- [ ] Deployment logs show actual values (not "NOT SET")
- [ ] Health endpoint returns "connected"

## Expected Logs (Success)

```
🔌 Connecting to MySQL...
📍 Host: containers-us-west-xxx.railway.app:6379
👤 User: root
🗄️  Database: railway
🔍 Environment check:
  - MYSQLHOST: containers-us-west-xxx.railway.app
  - MYSQLPORT: 6379
  - MYSQLUSER: root
  - MYSQLDATABASE: railway
  - MYSQLPASSWORD: ***SET***
✅ MySQL connection established
✅ Table created/verified: users
✅ Table created/verified: hp_cam_sessions
✅ Table created/verified: hp_cam_signals
✅ MySQL connected successfully!
🚀 Server running successfully!
```

## Expected Logs (Failure)

```
🔍 Environment check:
  - MYSQLHOST: NOT SET  ❌
  - MYSQLPORT: NOT SET  ❌
  - MYSQLUSER: NOT SET  ❌
  - MYSQLDATABASE: railway  ✅ (only this one set)
  - MYSQLPASSWORD: NOT SET  ❌
❌ MySQL connection failed: connect ECONNREFUSED ::1:3306
```

This means Railway references not resolved.

## Support

If still not working after following all steps:

1. **Railway Discord**
   - https://discord.gg/railway
   - Share your variable configuration
   - Share deployment logs

2. **Railway Docs**
   - https://docs.railway.com/reference/variables
   - Check for updates to reference syntax

3. **Provide Details**
   - Project ID
   - Service names
   - Variable configuration (without passwords)
   - Deployment logs with debug output

## Conclusion

Railway shared variables should work automatically. If not:
1. Verify MySQL service is running
2. Check variable names match exactly
3. Redeploy backend
4. Check debug logs for "NOT SET"

The debug logging we added will help identify exactly which variables are not resolving.
