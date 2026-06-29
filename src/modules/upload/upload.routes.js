const { Router } = require('express');
const { upload } = require('../../lib/cloudinary');
const uploadController = require('./upload.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = Router();

// Hanya seller yang bisa upload gambar produk
router.post(
  '/image',
  requireAuth,
  requireRole('SELLER'),
  upload.single('image'), // 'image' = nama field di form-data
  uploadController.uploadImage
);

router.delete(
  '/image',
  requireAuth,
  requireRole('SELLER'),
  uploadController.deleteImage
);

module.exports = router;