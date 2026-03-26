# Fix: MYSQLHOST NOT SET

## Problem Identified

Debug log menunjukkan:
```
- MYSQLHOST: NOT SET  ← PROBLEM!
- MYSQLPORT: 3306
- MYSQLUSER: root
- MYSQLDATABASE: railway
- MYSQLPASSWORD: ***SET***
```

Railway reference `${{shared.MYSQLHOST}}` tidak ter-resolve.

## Root Cause

Railway shared variables dengan syntax `${{shared.VARIABLE}}` tidak selalu work untuk semua variables. Ini adalah known issue dengan Railway's variable resolution.

## Solution: Use Service Reference

Instead of `${{shared.MYSQLHOST}}`, gunakan service reference `${{MySQL.MYSQLHOST}}`.

### Step 1: Check MySQL Service Name

1. Go to Railway project
2. Look at your MySQL service name
3. Common names: `MySQL`, `mysql`, `database`, `db`

### Step 2: Update Backend Variables

Go to backend service → Variables tab, update:

**FROM (Not Working):**
```env
MYSQLHOST=${{shared.MYSQLHOST}}
MYSQLPORT=${{shared.MYSQLPORT}}
```

**TO (Working):**
```env
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
```

Replace `MySQL` with your actual MySQL service name.

### Step 3: Alternative - Use MYSQL_URL

Railway MySQL provides `MYSQL_URL` which is a complete connection string. We can parse this instead.

**Option A: Use MYSQL_URL directly**

Update backend variables:
```env
MYSQL_URL=${{MySQL.MYSQL_URL}}
```

Then modify code to parse MYSQL_URL.

**Option B: Use individual service references**

```env
MYSQLHOST=${{MySQL.MYSQLHOST}}
MYSQLPORT=${{MySQL.MYSQLPORT}}
MYSQLUSER=${{MySQL.MYSQLUSER}}
MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
```

### Step 4: Manual Copy (Quickest Fix)

If references still don't work, manually copy values:

1. **Get MySQL Variables**
   - Click MySQL service
   - Go to Variables tab
   - Copy these values:
     - MYSQLHOST
     - MYSQLPORT
     - MYSQLUSER
     - MYSQLPASSWORD
     - MYSQLDATABASE

2. **Add to Backend**
   - Click backend service
   - Go to Variables tab
   - Delete the reference variables
   - Add as plain text:
     ```env
     MYSQLHOST=containers-us-west-123.railway.app
     MYSQLPORT=6543
     MYSQLUSER=root
     MYSQLPASSWORD=actual-password-here
     MYSQLDATABASE=railway
     ```

3. **Save**
   - Railway will auto-redeploy

## Quick Fix (Recommended)

**Use MYSQL_URL and parse it:**

1. **Update Backend Variables**
   ```env
   MYSQL_URL=${{MySQL.MYSQL_URL}}
   ```

2. **Update config.ts to parse MYSQL_URL**

I'll create the code change for this approach.

## Verification

After applying fix, check logs for:

```
✅ MYSQLHOST: containers-us-west-xxx.railway.app
✅ MYSQLPORT: 6543
✅ MYSQLUSER: root
✅ MYSQLDATABASE: railway
✅ MYSQLPASSWORD: ***SET***
✅ MySQL connection established
```

## Why This Happens

Railway's shared variables (`${{shared.X}}`) work differently than service references (`${{ServiceName.X}}`):

- **Shared variables**: Must be explicitly created in Project Settings
- **Service references**: Automatically available from service's own variables

MySQL service creates its own variables, not shared variables by default.

## Next Steps

Choose one approach:

1. ✅ **Use service reference** (Recommended)
   - `${{MySQL.MYSQLHOST}}`
   - Works automatically

2. ✅ **Use MYSQL_URL** (Easiest)
   - Parse connection string
   - Single variable

3. ✅ **Manual copy** (Most reliable)
   - Copy-paste actual values
   - No reference syntax

I'll implement the MYSQL_URL parsing approach as it's the most reliable.
