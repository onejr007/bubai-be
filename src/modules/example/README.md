# Example Module

Module template untuk AI Agent. Copy module ini sebagai starting point.

## 📋 Endpoints

- `GET /api/v1/example` - Get all items
- `GET /api/v1/example/:id` - Get item by ID
- `POST /api/v1/example` - Create new item
- `PUT /api/v1/example/:id` - Update item
- `DELETE /api/v1/example/:id` - Delete item

## 🧪 Testing

```bash
# Get all
curl http://localhost:3000/api/v1/example

# Get by ID
curl http://localhost:3000/api/v1/example/123

# Create
curl -X POST http://localhost:3000/api/v1/example \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'

# Update
curl -X PUT http://localhost:3000/api/v1/example/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"updated"}'

# Delete
curl -X DELETE http://localhost:3000/api/v1/example/123
```

## 📝 How to Use as Template

1. Copy this folder: `cp -r example my-module`
2. Rename all references from "example" to "my-module"
3. Update module.json
4. Implement your business logic
5. Test endpoints
6. Update this README

## 🏗️ Structure

- `routes.ts` - Route definitions
- `controller.ts` - Request handlers
- `service.ts` - Business logic (in-memory storage for demo)
- `module.json` - Module metadata

## 💡 Tips

- Keep business logic in service layer
- Use try-catch in controllers
- Throw AppError for operational errors
- Update module.json with your endpoints
