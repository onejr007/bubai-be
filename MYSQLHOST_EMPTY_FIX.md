# Fix: MYSQLHOST is Empty

## Problem Identified

Railway environment variables show:
```
MYSQLHOST=                    ← EMPTY!
MYSQL_URL=mysql://root:password@:3306/railway    ← Missing hostname after @
```

Railway MySQL service variables are not properly populated.

## Root Cause

Railway shared variables `${{shared.MYSQLHOST}}` are **NOT being resolved** because:

1. **MySQL service variables don't exist in "shared" namespace**
   - Railway MySQL creates variables in the MySQL service itself
   - NOT in the shared variables pool

2. **Incorrect reference syntax**
   - `${{shared.MYSQLHOST}}` looks for shared variable
   - But MySQL service creates `${{MySQL.MYSQLHOST}}`

## Solution: Fix Railway Variables

### Step 1: Check MySQL Service Variables

1. Go to Railway Dashboard
2. Click on **MySQL service** (not backend)
3. Go to **"Variables"** tab
4. Look for these variables:
   - `MYSQLHOST` - should have value like `containers-us-west-xxx.railway.app`
   - `MYSQLPORT` - should have value like `6543`
   - `MYSQL_URL` - should have complete URL

**If these variables are empty in MySQL service:**
- MySQL service is not fully provisioned
- Wait 2-3 minutes and refresh
- Or restart MySQL service

### Step 2: Fix Backend Service Variables

You have two options:

#### Option A: Use Correct Service Reference

Change backend variables from:
```env
MYSQLHOST=${{shared.MYSQLHOST}}
```

To:
```env
MYSQLHOST=${{MySQL.MYSQLHOST}}
```

Where `MySQL` is the exact name of your MySQL service (case-sensitive).

**How to find service name:**
1. Look at your MySQL service card in Railway
2. The name is at the top (e.g., "MySQL", "mysql", "database")
3. Use that exact name in the reference

#### Option B: Manual Copy (Recommended)

1. **Get values from MySQL service:**
   - Click MySQL service → Variables tab
   - Copy these values:
     ```
     MYSQLHOST=containers-us-west-xxx.railway.app
     MYSQLPORT=6543
     MYSQLUSER=root
     MYSQLPASSWORD=<long-password>
     MYSQLDATABASE=railway
     MYSQL_URL=mysql://root:<password>@containers-us-west-xxx.railway.app:6543/railway
     ```

2. **Update backend service:**
   - Click Backend service → Variables tab
   - **Delete** all `${{shared.X}}` variables
   - **Add** new variables with actual values (paste from MySQL service)

3. **Save**
   - Railway will auto-redeploy

### Step 3: Verify

After fixing, check deployment logs for:

```
============================================================
DEBUG: ALL ENVIRONMENT VARIABLES:
============================================================
MYSQLHOST=containers-us-west-xxx.railway.app  ✅
MYSQLPORT=6543  ✅
MYSQL_URL=mysql://root:password@containers-us-west-xxx.railway.app:6543/railway  ✅
============================================================
✅ Parsed MYSQL_URL successfully: { host: 'containers-us-west-xxx.railway.app', ... }
✅ MySQL connection established
```

## Why This Happens

Railway has different variable namespaces:

1. **Service variables** - `${{ServiceName.VARIABLE}}`
   - Created by the service itself
   - Example: `${{MySQL.MYSQLHOST}}`

2. **Shared variables** - `${{shared.VARIABLE}}`
   - Manually created in Project Settings
   - Must be explicitly shared

MySQL service creates **service variables**, not **shared variables**.

So `${{shared.MYSQLHOST}}` doesn't exist, but `${{MySQL.MYSQLHOST}}` does!

## Quick Fix Commands

If you have Railway CLI:

```bash
# Check MySQL service variables
railway service MySQL
railway variables

# Copy MYSQLHOST value, then set in backend
railway service backend
railway variables set MYSQLHOST='<value-from-mysql-service>'
railway variables set MYSQLPORT='<value-from-mysql-service>'
# ... repeat for all variables

# Or use service reference
railway variables set MYSQLHOST='${{MySQL.MYSQLHOST}}'
```

## Expected vs Actual

**Expected (what should happen):**
```
MYSQLHOST=containers-us-west-123.railway.app
MYSQL_URL=mysql://root:pass@containers-us-west-123.railway.app:6543/railway
```

**Actual (what's happening now):**
```
MYSQLHOST=                    ← Empty!
MYSQL_URL=mysql://root:pass@:6543/railway    ← Missing host!
```

## Verification Checklist

- [ ] MySQL service is running (green status)
- [ ] MySQL service has MYSQLHOST variable with actual value
- [ ] Backend variables use correct reference (`${{MySQL.X}}` not `${{shared.X}}`)
- [ ] OR backend variables have actual values (manual copy)
- [ ] Deployment logs show actual hostname (not empty)
- [ ] Health endpoint returns "connected"

## Still Not Working?

If MySQL service variables are also empty:

1. **Restart MySQL service:**
   - Click MySQL service
   - Settings → Restart

2. **Check Railway status:**
   - https://status.railway.app
   - Check for MySQL provisioning issues

3. **Contact Railway support:**
   - Discord: https://discord.gg/railway
   - Provide project ID and service names

## Summary

**Problem:** `${{shared.MYSQLHOST}}` is empty because it doesn't exist.

**Solution:** Use `${{MySQL.MYSQLHOST}}` or copy actual values manually.

**Why:** Railway MySQL creates service variables, not shared variables.
