const { Router } = require('express');
const paymentController = require('./payment.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');

const router = Router();

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