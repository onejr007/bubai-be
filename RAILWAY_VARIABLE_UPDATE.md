# Railway Variable Update - FINAL FIX

## Problem
`MYSQLHOST` tidak ter-resolve dari `${{shared.MYSQLHOST}}`.

## Solution Implemented
Code sekarang support **MYSQL_URL** parsing. Ini adalah cara paling reliable untuk Railway MySQL.

## Update Railway Variables

### Option 1: Use MYSQL_URL (RECOMMENDED)

1. **Go to Backend Service**
   - Railway Dashboard → Your Project → Backend Service
   - Click **"Variables"** tab

2. **Add MYSQL_URL**
   - Click **"+ New Variable"**
   - Name: `MYSQL_URL`
   - Value: `${{MySQL.MYSQL_URL}}`
   - Click **"Add"**

   **OR** if your MySQL service has different name:
   - Value: `${{YourMySQLServiceName.MYSQL_URL}}`

3. **Remove Old Variables (Optional)**
   You can keep or remove these:
   - `MYSQLHOST=${{shared.MYSQLHOST}}`
   - `MYSQLPORT=${{shared.MYSQLPORT}}`
   - etc.

4. **Save**
   - Railway will auto-redeploy

### Option 2: Use Service Reference

Update existing variables to use service reference:

```env
# Change FROM:
MYSQLHOST=${{shared.MYSQLHOST}}
MYSQLPORT=${{shared.MYSQLPORT}}
MYSQLUSER=${{shared.MYSQLUSER}}
MYSQLPASSWORD=${{shared.MYSQLPASSWORD}}
MYSQLDATABASE=${{shared.MYSQLDATABASE}}

# Change TO:
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
```

Replace `MySQL` with your actual MySQL service name.

### Option 3: Manual Copy (Most Reliable)

1. **Get MySQL Credentials**
   - Click MySQL service
   - Go to **"Variables"** tab
   - Copy these values:
     - `MYSQLHOST`
     - `MYSQLPORT`
     - `MYSQLUSER`
     - `MYSQLPASSWORD`
     - `MYSQLDATABASE`

2. **Update Backend Variables**
   - Click backend service
   - Go to **"Variables"** tab
   - Delete reference variables
   - Add as plain text (paste actual values)

3. **Save**
   - Railway will auto-redeploy

## How It Works Now

Code will try in this order:

1. **Parse MYSQL_URL** (if set)
   ```
   mysql://user:password@host:port/database
   ```

2. **Fallback to individual variables** (if MYSQL_URL not set)
   ```
   MYSQLHOST, MYSQLPORT, MYSQLUSER, etc.
   ```

## Expected Logs After Fix

```
🔍 Environment check:
  - MYSQL_URL: ***SET***  ✅
  - MYSQLHOST: NOT SET (OK, using MYSQL_URL)
  - MYSQLPORT: NOT SET (OK, using MYSQL_URL)
  - MYSQLUSER: root
  - MYSQLDATABASE: railway
  - MYSQLPASSWORD: ***SET***
  - Parsed config: containers-us-west-xxx.railway.app:6543  ✅

✅ MySQL connection established
✅ Table created/verified: users
✅ Table created/verified: hp_cam_sessions
✅ Table created/verified: hp_cam_signals
✅ MySQL connected successfully!
🚀 Server running successfully!
```

## Verification

After updating variables:

1. **Check Deployment Logs**
   - Should see "Parsed config: [actual-host]:[actual-port]"
   - Should NOT see "localhost:3306"

2. **Test Health Endpoint**
   ```bash
   curl https://your-app.railway.app/health
   ```
   Expected: `"database":"connected"`

3. **Test Stats Endpoint**
   ```bash
   curl https://your-app.railway.app/api/v1/hp-cam-session/stats
   ```
   Expected: `"storage":"mysql","connected":true`

## Why MYSQL_URL is Better

✅ **Single variable** - easier to manage
✅ **Always provided** by Railway MySQL
✅ **No reference issues** - direct service reference works
✅ **Standard format** - mysql://user:pass@host:port/db
✅ **Automatic parsing** - code handles it

## Troubleshooting

### Still seeing "localhost:3306"?

**Check:**
1. MYSQL_URL is set in backend variables
2. MYSQL_URL reference is correct: `${{MySQL.MYSQL_URL}}`
3. MySQL service name matches (case-sensitive)
4. Backend redeployed after variable change

### MYSQL_URL not working?

**Fallback to manual:**
1. Copy all MySQL credentials manually
2. Paste as plain text in backend variables
3. No reference syntax, just actual values

## Quick Command

If you have Railway CLI:

```bash
# Check current variables
railway variables

# Add MYSQL_URL
railway variables set MYSQL_URL='${{MySQL.MYSQL_URL}}'

# Redeploy
railway up
```

## Summary

**Before:**
```env
MYSQLHOST=${{shared.MYSQLHOST}}  ← Not working
```

**After (Option 1 - Recommended):**
```env
MYSQL_URL=${{MySQL.MYSQL_URL}}  ← Works!
```

**After (Option 2):**
```env
MYSQLHOST=${{MySQL.MYSQLHOST}}  ← Works!
```

**After (Option 3):**
```env
MYSQLHOST=containers-us-west-xxx.railway.app  ← Works!
```

Choose the option that works best for you. Option 1 (MYSQL_URL) is recommended as it's the most reliable.
