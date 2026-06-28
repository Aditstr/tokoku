const { Router } = require('express');
const orderController = require('./order.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = Router();

// Semua order routes butuh login
router.use(requireAuth);

// ─── Buyer routes ─────────────────────────────────────────────
router.post('/',           requireRole('BUYER'), orderController.createOrder);
router.get('/my-orders',   requireRole('BUYER'), orderController.getMyOrders);
router.get('/:id',         requireRole('BUYER'), orderController.getOrderById);
router.patch('/:id/cancel',requireRole('BUYER'), orderController.cancelOrder);

// ─── Seller routes ────────────────────────────────────────────
router.get('/seller/incoming',          requireRole('SELLER'), orderController.getSellerOrders);
router.patch('/seller/:id/status',      requireRole('SELLER'), orderController.updateOrderStatus);

module.exports = router;