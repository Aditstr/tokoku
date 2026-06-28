const { Router } = require('express');
const productController = require('./product.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = Router();

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