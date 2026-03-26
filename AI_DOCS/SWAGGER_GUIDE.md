# Swagger/OpenAPI Documentation Guide

## 📚 Akses Swagger UI

### Production
```
https://bub-ai-be.web.app/api-docs
```

### Development
```
http://localhost:3000/api-docs
```

### Swagger JSON
```
https://bub-ai-be.web.app/api-docs.json
http://localhost:3000/api-docs.json
```

## 🎯 Cara Menambahkan Dokumentasi ke Module Baru

### 1. Tambahkan JSDoc Comments di routes.ts

```typescript
/**
 * @swagger
 * /api/v1/your-module:
 *   get:
 *     summary: Deskripsi endpoint
 *     tags: [YourModule]
 *     description: Deskripsi detail
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', yourController.getAll);
```

### 2. Definisikan Schema (jika perlu)

Edit `src/core/swagger.ts` untuk menambahkan schema baru:

```typescript
components: {
  schemas: {
    YourModel: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: '123'
        },
        name: {
          type: 'string',
          example: 'Example'
        }
      }
    }
  }
}
```

### 3. Tambahkan Tag (opsional)

Edit `src/core/swagger.ts`:

```typescript
tags: [
  {
    name: 'YourModule',
    description: 'Your module endpoints'
  }
]
```

## 📋 Template Swagger Annotations

### GET All
```typescript
/**
 * @swagger
 * /api/v1/module:
 *   get:
 *     summary: Get all items
 *     tags: [Module]
 *     responses:
 *       200:
 *         description: List of items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/YourModel'
 */
```

### GET by ID
```typescript
/**
 * @swagger
 * /api/v1/module/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Module]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 */
```

### POST
```typescript
/**
 * @swagger
 * /api/v1/module:
 *   post:
 *     summary: Create new item
 *     tags: [Module]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourModelInput'
 *     responses:
 *       201:
 *         description: Item created
 */
```

### PUT
```typescript
/**
 * @swagger
 * /api/v1/module/{id}:
 *   put:
 *     summary: Update item
 *     tags: [Module]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourModelInput'
 *     responses:
 *       200:
 *         description: Item updated
 *       404:
 *         description: Item not found
 */
```

### DELETE
```typescript
/**
 * @swagger
 * /api/v1/module/{id}:
 *   delete:
 *     summary: Delete item
 *     tags: [Module]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */
```

## 🎨 Swagger UI Features

1. **Try it out** - Test endpoints langsung dari browser
2. **Schema visualization** - Lihat struktur data
3. **Response examples** - Contoh response
4. **Authentication** - Support untuk auth headers (jika ada)

## 📝 Best Practices

1. **Selalu dokumentasikan semua endpoints**
2. **Gunakan tags untuk grouping**
3. **Definisikan schema untuk reusability**
4. **Tambahkan examples yang jelas**
5. **Dokumentasikan error responses**
6. **Update swagger.ts jika ada perubahan global**

## 🔄 Auto-Reload

Swagger spec akan auto-reload saat:
- Server restart
- File routes.ts berubah
- swagger.ts di-update

## 🚀 Deployment

Swagger UI otomatis ter-deploy ke Firebase:
```
https://bub-ai-be.web.app/api-docs
```

## 💡 Tips untuk AI Agent

1. Copy template dari module `example` atau `users`
2. Ganti nama module dan schema
3. Test di `/api-docs` setelah server running
4. Pastikan semua endpoints terdokumentasi
5. Gunakan `$ref` untuk reuse schema

---

**Swagger membuat API documentation otomatis dan interaktif!**
