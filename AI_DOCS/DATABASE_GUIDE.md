# Database Guide - Couchbase Integration

## 🗄️ Database Service

Framework ini menggunakan Couchbase Cloud sebagai database. Database service sudah terintegrasi di core framework.

## 🔌 Connection

Database otomatis connect saat server start. Konfigurasi ada di `.env`:

```env
COUCHBASE_CONNECTION_STRING=couchbases://cb.s0ukypm-djhcdpt.cloud.couchbase.com
COUCHBASE_USERNAME=your-username
COUCHBASE_PASSWORD=your-password
COUCHBASE_BUCKET=your-bucket-name
```

## 📦 Menggunakan Database di Module

### Import Database Service

```typescript
import { db } from '@/core/database';
```

### Get Collection

```typescript
const collection = db.getCollection('_default', 'your-collection-name');
```

### Get Cluster (untuk N1QL Query)

```typescript
const cluster = db.getCluster();
```

## 🔍 CRUD Operations

### Create Document

```typescript
import { v4 as uuidv4 } from 'uuid';

const id = uuidv4();
const data = {
  id,
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date().toISOString()
};

const collection = db.getCollection('_default', 'users');
await collection.insert(id, data);
```

### Read Document

```typescript
const collection = db.getCollection('_default', 'users');
const result = await collection.get(id);
const user = result.content;
```

### Update Document

```typescript
const collection = db.getCollection('_default', 'users');
const existing = await collection.get(id);

const updated = {
  ...existing.content,
  name: 'Jane Doe',
  updatedAt: new Date().toISOString()
};

await collection.replace(id, updated);
```

### Delete Document

```typescript
const collection = db.getCollection('_default', 'users');
await collection.remove(id);
```

## 🔎 N1QL Queries

### Get All Documents

```typescript
const cluster = db.getCluster();
const bucketName = db.getBucket().name;

const query = `
  SELECT META().id, users.* 
  FROM \`${bucketName}\`._default.users AS users
`;

const result = await cluster.query(query);
const users = result.rows;
```

### Query with WHERE

```typescript
const query = `
  SELECT META().id, users.* 
  FROM \`${bucketName}\`._default.users AS users
  WHERE users.email = $email
`;

const result = await cluster.query(query, {
  parameters: { email: 'john@example.com' }
});
```

### Query with LIMIT

```typescript
const query = `
  SELECT META().id, users.* 
  FROM \`${bucketName}\`._default.users AS users
  LIMIT 10
`;

const result = await cluster.query(query);
```

## 🛡️ Error Handling

### Document Not Found

```typescript
try {
  const result = await collection.get(id);
} catch (error: any) {
  if (error.message?.includes('document not found')) {
    throw new AppError(404, 'Document not found');
  }
  throw error;
}
```

### Collection Not Found

```typescript
try {
  const result = await cluster.query(query);
} catch (error: any) {
  if (error.message?.includes('not found')) {
    return []; // Return empty array
  }
  throw error;
}
```

## 📋 Best Practices

1. **Use UUID for Document IDs**
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   const id = uuidv4();
   ```

2. **Always Add Timestamps**
   ```typescript
   {
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString()
   }
   ```

3. **Use Collection per Module**
   - Module `users` → Collection `users`
   - Module `products` → Collection `products`

4. **Handle Errors Properly**
   - Document not found → 404
   - Validation error → 400
   - Database error → 500

5. **Use N1QL for Complex Queries**
   - Simple CRUD → Use collection methods
   - Complex queries → Use N1QL

## 📝 Example Service Template

```typescript
import { db } from '@/core/database';
import { AppError } from '@/core/middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

interface Item {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

class ItemService {
  private collectionName = 'items';

  private getCollection() {
    return db.getCollection('_default', this.collectionName);
  }

  async getAll(): Promise<Item[]> {
    const cluster = db.getCluster();
    const bucketName = db.getBucket().name;
    const query = `SELECT META().id, items.* FROM \`${bucketName}\`._default.${this.collectionName} AS items`;
    
    const result = await cluster.query(query);
    return result.rows;
  }

  async getById(id: string): Promise<Item> {
    try {
      const collection = this.getCollection();
      const result = await collection.get(id);
      return { id, ...result.content } as Item;
    } catch (error: any) {
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'Item not found');
      }
      throw error;
    }
  }

  async create(payload: Partial<Item>): Promise<Item> {
    const id = uuidv4();
    const item: Item = {
      id,
      name: payload.name || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const collection = this.getCollection();
    await collection.insert(id, item);
    
    return item;
  }

  async update(id: string, payload: Partial<Item>): Promise<Item> {
    try {
      const collection = this.getCollection();
      const existing = await collection.get(id);
      
      const updated: Item = {
        ...existing.content,
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
      } as Item;

      await collection.replace(id, updated);
      return updated;
    } catch (error: any) {
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'Item not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.remove(id);
    } catch (error: any) {
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'Item not found');
      }
      throw error;
    }
  }
}

export const itemService = new ItemService();
```

## 🧪 Testing Database

```bash
# Create user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get all users
curl http://localhost:3000/api/v1/users

# Get user by ID
curl http://localhost:3000/api/v1/users/{id}

# Update user
curl -X PUT http://localhost:3000/api/v1/users/{id} \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe"}'

# Delete user
curl -X DELETE http://localhost:3000/api/v1/users/{id}
```

## 🔍 Health Check

Database status included in health check:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T...",
  "database": "connected"
}
```

---

**Database service siap digunakan oleh semua module!**
