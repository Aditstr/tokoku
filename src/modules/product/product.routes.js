const { Router } = require('express');
const productController = require('./product.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = Router();

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Lihat daftar produk
 *     tags: [Product]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Daftar produk dengan pagination
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Lihat detail produk
 *     tags: [Product]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail produk
 *       404:
 *         description: Produk tidak ditemukan
 */
router.get('/:id', productController.getProductById);

/**
 * @swagger
 * /api/v1/products/seller/my-products:
 *   get:
 *     summary: Lihat produk milik sendiri (seller)
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Daftar produk milik seller
 *       403:
 *         description: Hanya seller yang bisa akses
 */
router.get(
  '/seller/my-products',
  requireAuth,
  requireRole('SELLER'),
  productController.getMyProducts
);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Buat produk baru (seller only)
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, categoryId]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: integer
 *               stock:
 *                 type: integer
 *               imageUrl:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Produk berhasil dibuat
 *       403:
 *         description: Hanya seller yang bisa buat produk
 */
router.post(
  '/',
  requireAuth,
  requireRole('SELLER'),
  productController.createProduct
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update produk milik sendiri (seller)
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produk berhasil diupdate
 *       403:
 *         description: Bukan pemilik produk ini
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('SELLER'),
  productController.updateProduct
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Hapus produk milik sendiri (seller)
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produk berhasil dihapus
 *       403:
 *         description: Bukan pemilik produk ini
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('SELLER'),
  productController.deleteProduct
);

// ─── Public routes — siapapun bisa akses ─────────────────────
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// ─── Protected routes — harus login ──────────────────────────
router.get(
  '/seller/my-products',
  requireAuth,
  requireRole('SELLER'),
  productController.getMyProducts
);

router.post(
  '/',
  requireAuth,
  requireRole('SELLER'),  // hanya seller boleh buat produk
  productController.createProduct
);

router.put(
  '/:id',
  requireAuth,
  requireRole('SELLER'),
  productController.updateProduct
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('SELLER'),
  productController.deleteProduct
);

module.exports = router;