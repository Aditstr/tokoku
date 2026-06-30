const { Router } = require('express');
const orderController = require('./order.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = Router();

// Semua order routes butuh login
router.use(requireAuth);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Checkout — buat order baru (buyer only)
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order berhasil dibuat
 *       400:
 *         description: Stok tidak cukup atau input tidak valid
 *       403:
 *         description: Hanya buyer yang bisa checkout
 */
router.post('/', requireRole('BUYER'), orderController.createOrder);

/**
 * @swagger
 * /api/v1/orders/my-orders:
 *   get:
 *     summary: Lihat riwayat order milik sendiri (buyer)
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: Daftar order milik buyer
 */
router.get('/my-orders', requireRole('BUYER'), orderController.getMyOrders);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Lihat detail satu order (buyer)
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail order
 *       403:
 *         description: Bukan pemilik order ini
 *       404:
 *         description: Order tidak ditemukan
 */
router.get('/:id', requireRole('BUYER'), orderController.getOrderById);

/**
 * @swagger
 * /api/v1/orders/{id}/cancel:
 *   patch:
 *     summary: Batalkan order (buyer, hanya status PENDING)
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order dibatalkan, stok dikembalikan
 *       400:
 *         description: Order tidak bisa dibatalkan (status bukan PENDING)
 */
router.patch('/:id/cancel', requireRole('BUYER'), orderController.cancelOrder);

/**
 * @swagger
 * /api/v1/orders/seller/incoming:
 *   get:
 *     summary: Lihat order masuk yang berisi produk milik sendiri (seller)
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: Daftar order yang berisi produk seller ini
 */
router.get('/seller/incoming', requireRole('SELLER'), orderController.getSellerOrders);

/**
 * @swagger
 * /api/v1/orders/seller/{id}/status:
 *   patch:
 *     summary: Update status order (seller)
 *     tags: [Order]
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
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PAID, SHIPPED, DELIVERED]
 *     responses:
 *       200:
 *         description: Status order berhasil diubah
 *       400:
 *         description: Urutan status tidak valid
 */
router.patch('/seller/:id/status', requireRole('SELLER'), orderController.updateOrderStatus);

// ─── Buyer routes ─────────────────────────────────────────────
router.post('/',           requireRole('BUYER'), orderController.createOrder);
router.get('/my-orders',   requireRole('BUYER'), orderController.getMyOrders);
router.get('/:id',         requireRole('BUYER'), orderController.getOrderById);
router.patch('/:id/cancel',requireRole('BUYER'), orderController.cancelOrder);

// ─── Seller routes ────────────────────────────────────────────
router.get('/seller/incoming',          requireRole('SELLER'), orderController.getSellerOrders);
router.patch('/seller/:id/status',      requireRole('SELLER'), orderController.updateOrderStatus);

module.exports = router;