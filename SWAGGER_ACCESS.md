# Swagger API Documentation Access

## ✅ Swagger is Now Accessible!

### URLs:

**Swagger UI (Interactive):**
```
http://localhost:3000/api-docs
```

**Swagger JSON (Spec):**
```
http://localhost:3000/api-docs.json
```

## 🚀 How to Access

### 1. Start Backend Server

```bash
cd BE
npm run dev
```

Wait for:
```
info: 🚀 Server running on port 3000
info: 📚 Swagger UI: http://localhost:3000/api-docs
```

### 2. Open Browser

Navigate to: **http://localhost:3000/api-docs**

You should see the Swagger UI with all API endpoints documented.

## 📋 Available Endpoints in Swagger

### Health
- `GET /health` - Health check with database status

### Example Module (In-Memory)
- `GET /api/v1/example` - Get all items
- `GET /api/v1/example/:id` - Get item by ID
- `POST /api/v1/example` - Create item
- `PUT /api/v1/example/:id` - Update item
- `DELETE /api/v1/example/:id` - Delete item

### Users Module (Couchbase)
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### HP Camera Session (Couchbase)
- `POST /api/v1/hp-cam-session/create` - Create session
- `POST /api/v1/hp-cam-session/join` - Join session
- `GET /api/v1/hp-cam-session/:id/status` - Get status
- `POST /api/v1/hp-cam-session/signal` - Send signal
- `GET /api/v1/hp-cam-session/signal/:id` - Get signals
- `POST /api/v1/hp-cam-session/end` - End session

## 🔧 Troubleshooting

### Issue: Cannot access Swagger UI

**Solution 1: Check if server is running**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T...",
  "database": "disconnected"
}
```

**Solution 2: Check port**
Server runs on port 3000 by default. If port is in use, change in `.env`:
```env
PORT=3001
```

**Solution 3: Check logs**
Look for:
```
info: 📚 Swagger UI: http://localhost:3000/api-docs
```

### Issue: Database connection timeout

This is normal if Couchbase credentials are not configured or network is slow.

Server will continue without database:
```
warn: ⚠️ Couchbase connection failed, continuing without database
warn: Database-dependent endpoints will not work
```

**What works without database:**
- ✅ Swagger UI
- ✅ Health endpoint
- ✅ Example module (in-memory)

**What doesn't work without database:**
- ❌ Users module
- ❌ HP Camera session module

**To fix:** Configure Couchbase credentials in `.env`

### Issue: Swagger UI shows but no endpoints

**Check:** Module loading logs
```
info: 📦 Loading 3 modules...
info: ✅ Module loaded: example
info: ✅ Module loaded: hp-cam-session
info: ✅ Module loaded: users
```

If modules not loading, check:
1. Files exist in `src/modules/`
2. Each module has `routes.ts`
3. No syntax errors in module files

## 🎨 Swagger UI Features

### Try It Out
1. Click on any endpoint
2. Click "Try it out"
3. Fill in parameters
4. Click "Execute"
5. See response

### Schemas
- Click "Schemas" at bottom
- See all data models
- Understand request/response structure

### Servers
- Switch between development and production
- Currently: `http://localhost:3000`

## 📝 Adding Documentation to New Endpoints

When creating new endpoints, add JSDoc comments:

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Description
 *     tags: [YourModule]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/your-endpoint', controller.handler);
```

Swagger will auto-generate documentation!

## 🌐 Production Access

After deploying to Render.com:
```
https://your-app.onrender.com/api-docs
```

## 💡 Tips

1. **Bookmark Swagger UI** for quick access
2. **Use "Try it out"** to test endpoints without Postman
3. **Check schemas** to understand data structure
4. **Export spec** via `/api-docs.json` for other tools
5. **Share with team** - Swagger is self-documenting!

---

**Swagger UI is your interactive API playground!** 🎮
