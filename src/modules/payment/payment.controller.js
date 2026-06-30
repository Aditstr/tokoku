const paymentService = require('./payment.service');
const AppError = require('../../lib/AppError');

async function createInvoice(req, res, next) {
  try {
    const { orderId } = req.params;
    const result = await paymentService.createInvoice(orderId, req.user.userId);

    res.json({
      success: true,
      message: 'Invoice berhasil dibuat',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

async function webhook(req, res, next) {
  try {
    // Verifikasi callback token — pastikan request benar dari Xendit
    const callbackToken = req.headers['x-callback-token'];

    if (callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
      throw new AppError('INVALID_CALLBACK', 'Callback token tidak valid', 401);
    }

    await paymentService.handleWebhook(req.body);

    // Xendit butuh response 200 untuk tahu webhook diterima
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createInvoice, webhook };