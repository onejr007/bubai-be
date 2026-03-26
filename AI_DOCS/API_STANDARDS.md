# API Standards for AI Agents

## 🎯 Response Format

Semua API endpoint WAJIB menggunakan format response standard:

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

## 📍 HTTP Status Codes

Gunakan status code yang tepat:

- `200` - OK (GET, PUT success)
- `201` - Created (POST success)
- `204` - No Content (DELETE success)
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🛣️ URL Structure

```
http://localhost:3000/api/v1/[module-name]/[resource]
```

Contoh:
- GET `/api/v1/users` - Get all users
- GET `/api/v1/users/:id` - Get user by ID
- POST `/api/v1/users` - Create user
- PUT `/api/v1/users/:id` - Update user
- DELETE `/api/v1/users/:id` - Delete user

## 📋 Request/Response Examples

### GET Request
```bash
curl http://localhost:3000/api/v1/example
```

Response:
```json
{
  "status": "success",
  "data": []
}
```

### POST Request
```bash
curl -X POST http://localhost:3000/api/v1/example \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": "123",
    "name": "test"
  }
}
```
