# Quick Start Guide

## 🚀 Setup & Run (5 Minutes)

### 1. Install Dependencies
```bash
cd BE
npm install
```

### 2. Configure Environment
```bash
# Copy example
cp .env.example .env

# Edit .env with your Couchbase credentials
# Already configured for cloud.couchbase.com
```

### 3. Run Development Server
```bash
npm run dev
```

Server akan berjalan di: http://localhost:3000

### 4. Test Endpoints

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Swagger UI:**
Buka browser: http://localhost:3000/api-docs

**Create User:**
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

**Get All Users:**
```bash
curl http://localhost:3000/api/v1/users
```

## 📦 Build for Production

```bash
npm run build
```

Output: `dist/` folder

## 🚀 Deploy to Firebase

```bash
npm run build
firebase deploy
```

Production URL: https://bub-ai-be.web.app

## 🧪 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 📚 Documentation

- **API Docs:** http://localhost:3000/api-docs
- **Framework Guide:** [AI_DOCS/README.md](./AI_DOCS/README.md)
- **Database Guide:** [AI_DOCS/DATABASE_GUIDE.md](./AI_DOCS/DATABASE_GUIDE.md)
- **Module Creation:** [AI_DOCS/MODULE_CREATION.md](./AI_DOCS/MODULE_CREATION.md)

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### Database Connection Failed
- Check Couchbase credentials in `.env`
- Verify bucket name exists
- Test connection string

### Build Errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## 🎯 Next Steps

1. ✅ Server running
2. ✅ Test endpoints
3. ✅ Check Swagger docs
4. Create your first module (see [MODULE_CREATION.md](./AI_DOCS/MODULE_CREATION.md))
5. Deploy to production

---

**Ready to code!** 🎉
