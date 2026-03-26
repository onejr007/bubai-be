# Users Module

Module untuk user management dengan Couchbase integration.

## 📋 Endpoints

- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## 🗄️ Database

- Collection: `users`
- Scope: `_default`
- Bucket: Configured in `.env`

## 📝 Data Structure

```typescript
{
  id: string;        // UUID
  name: string;
  email: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

## 🧪 Testing

### Create User
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### Get All Users
```bash
curl http://localhost:3000/api/v1/users
```

### Get User by ID
```bash
curl http://localhost:3000/api/v1/users/{id}
```

### Update User
```bash
curl -X PUT http://localhost:3000/api/v1/users/{id} \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com"}'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/v1/users/{id}
```

## 💡 Implementation Notes

- Uses UUID for document IDs
- Automatic timestamps (createdAt, updatedAt)
- N1QL queries for listing all users
- Proper error handling (404 for not found)
- Collection-based CRUD operations

## 🔍 Example Response

### Success (GET)
```json
{
  "status": "success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-03-26T10:00:00.000Z",
    "updatedAt": "2026-03-26T10:00:00.000Z"
  }
}
```

### Error (404)
```json
{
  "status": "error",
  "message": "User not found"
}
```
