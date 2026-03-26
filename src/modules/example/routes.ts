import { Router } from 'express';
import { exampleController } from './controller';

const router = Router();

/**
 * @swagger
 * /api/v1/example:
 *   get:
 *     summary: Get all items
 *     tags: [Example]
 *     description: Retrieve all items from in-memory storage
 *     responses:
 *       200:
 *         description: List of items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', exampleController.getAll);

/**
 * @swagger
 * /api/v1/example/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Example]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 */
router.get('/:id', exampleController.getById);

/**
 * @swagger
 * /api/v1/example:
 *   post:
 *     summary: Create new item
 *     tags: [Example]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Item created
 */
router.post('/', exampleController.create);

/**
 * @swagger
 * /api/v1/example/{id}:
 *   put:
 *     summary: Update item
 *     tags: [Example]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item updated
 *       404:
 *         description: Item not found
 */
router.put('/:id', exampleController.update);

/**
 * @swagger
 * /api/v1/example/{id}:
 *   delete:
 *     summary: Delete item
 *     tags: [Example]
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
router.delete('/:id', exampleController.delete);

export default router;
