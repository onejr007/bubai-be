# FINAL FIX - Railway Variables

## Problem Identified

Railway **TIDAK me-resolve** `${{shared.VARIABLE}}` references!

Your current variables:
```env
MYSQL_URL=${{shared.MYSQL_URL}}  ← Railway tidak resolve ini!
MYSQLHOST=${{shared.MYSQLHOST}}  ← Railway tidak resolve ini!
```

Railway hanya resolve `${{ServiceName.VARIABLE}}`, bukan `${{shared.VARIABLE}}`.

## Solution: Find MySQL Service Name

### Step 1: Find Your MySQL Service Name

1. Go to Railway Dashboard
2. Look at your MySQL service
3. The name is shown at the top (e.g., "MySQL", "mysql", "database")

**Common names:**
- `MySQL` (default)
- `mysql`
- `database`
- `db`

### Step 2: Update ALL Variables

Go to Backend Service → Variables tab, update SEMUA variables:

**Change FROM:**
```env
MYSQL_URL=${{shared.MYSQL_URL}}
MYSQLHOST=${{shared.MYSQLHOST}}
MYSQLPORT=${{shared.MYSQLPORT}}
MYSQLUSER=${{shared.MYSQLUSER}}
MYSQLPASSWORD=${{shared.MYSQLPASSWORD}}
MYSQLDATABASE=${{shared.MYSQLDATABASE}}
```

**Change TO (replace `MySQL` with your actual service name):**
```env
MYSQL_URL=${{MySQL.MYSQL_URL}}
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
```

### Step 3: Save and Redeploy

Railway will automatically redeploy after you save variables.

## Alternative: Manual Copy (100% Reliable)

If service reference still doesn't work:

### Step 1: Get MySQL Credentials

1. Click **MySQL service**
2. Go to **"Variables"** tab
3. Find and copy these values:
   - `MYSQLHOST` (e.g., `containers-us-west-123.railway.app`)
   - `MYSQLPORT` (e.g., `6543`)
   - `MYSQLUSER` (e.g., `root`)
   - `MYSQLPASSWORD` (long random string)
   - `MYSQLDATABASE` (e.g., `railway`)
   - `MYSQL_URL` (e.g., `mysql://root:password@host:port/railway`)

### Step 2: Update Backend Variables

1. Click **Backend service**
2. Go to **"Variables"** tab
3. **DELETE** all the `${{shared.X}}` variables
4. **ADD NEW** variables with actual values:

```env
MYSQL_URL=mysql://root:actual-password@containers-us-west-123.railway.app:6543/railway
MYSQLHOST=containers-us-west-123.railway.app
MYSQLPORT=6543
MYSQLUSER=root
MYSQLPASSWORD=actual-password-here
MYSQLDATABASE=railway
```

### Step 3: Save

Railway will auto-redeploy with actual values.

## Expected Logs After Fix

```
DEBUG: MYSQL_URL value: mysql://root:password@containers-us-west-123.railway.app:6543/railway
DEBUG: Parsed successfully: { host: 'containers-us-west-123.railway.app', port: '6543', ... }
🔌 Connecting to MySQL...
📍 Host: containers-us-west-123.railway.app:6543  ✅
👤 User: root
🗄️  Database: railway
🔍 Environment check:
  - MYSQL_URL: ***SET***
  - MYSQLHOST: containers-us-west-123.railway.app  ✅
  - MYSQLPORT: 6543  ✅
  - Parsed config: containers-us-west-123.railway.app:6543  ✅
✅ MySQL connection established
```

## Why `${{shared.X}}` Doesn't Work

Railway's variable resolution:

❌ **Does NOT work:**
```env
${{shared.VARIABLE}}  ← "shared" is not a service name
```

✅ **Works:**
```env
${{MySQL.VARIABLE}}  ← "MySQL" is actual service name
```

✅ **Always works:**
```env
VARIABLE=actual-value  ← Plain text value
```

## Quick Check

After updating variables, check logs for:

1. **MYSQL_URL value should be actual URL:**
   ```
   DEBUG: MYSQL_URL value: mysql://root:...@containers-us-west-xxx.railway.app:6543/railway
   ```
   
   **NOT:**
   ```
   DEBUG: MYSQL_URL value: ${{shared.MYSQL_URL}}  ← Still not resolved!
   ```

2. **Parsed config should be actual host:**
   ```
   Parsed config: containers-us-west-xxx.railway.app:6543
   ```
   
   **NOT:**
   ```
   Parsed config: localhost:3306  ← Still using default!
   ```

## Verification Commands

```bash
# Check health
curl https://your-app.railway.app/health

# Should return:
{"status":"ok","timestamp":"...","database":"connected"}

# Check stats
curl https://your-app.railway.app/api/v1/hp-cam-session/stats

# Should return:
{"status":"success","data":{"storage":"mysql","connected":true}}
```

## Summary

**The Problem:**
- Railway does NOT resolve `${{shared.VARIABLE}}`
- You need to use `${{ActualServiceName.VARIABLE}}`
- OR copy actual values manually

**The Fix:**
1. Find your MySQL service name (e.g., "MySQL")
2. Change `${{shared.X}}` to `${{MySQL.X}}`
3. OR copy actual values manually

**Choose the easiest option for you:**
- Option 1: Change to `${{MySQL.X}}` (if you know service name)
- Option 2: Copy actual values (most reliable, no references)

I recommend **Option 2** (manual copy) as it's 100% reliable and no reference syntax issues.
