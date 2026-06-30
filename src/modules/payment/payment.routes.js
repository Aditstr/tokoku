const { Router } = require('express');
const paymentController = require('./payment.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = Router();

/**
 * @swagger
 * /api/v1/payments/orders/{orderId}/invoice:
 *   post:
 *     summary: Buat invoice pembayaran Xendit untuk sebuah order (buyer)
 *     tags: [Payment]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice berhasil dibuat, dapat paymentUrl
 *       400:
 *         description: Order tidak dalam status PENDING
 *       403:
 *         description: Bukan pemilik order ini
 *       404:
 *         description: Order tidak ditemukan
 */
router.post(
  '/orders/:orderId/invoice',
  requireAuth,
  requireRole('BUYER'),
  paymentController.createInvoice
);

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Webhook dari Xendit — dipanggil otomatis oleh Xendit, bukan oleh client
 *     tags: [Payment]
 *     security: []
 *     responses:
 *       200:
 *         description: Webhook diterima
 *       401:
 *         description: Callback token tidak valid
 */
router.post('/webhook', paymentController.webhook);

// Buyer buat invoice untuk order miliknya
router.post(
  '/orders/:orderId/invoice',
  requireAuth,
  requireRole('BUYER'),
  paymentController.createInvoice
);

// Webhook — TIDAK pakai requireAuth, karena ini dipanggil Xendit, bukan user
router.post('/webhook', paymentController.webhook);

module.exports = router;