const { Invoice } = require('../../lib/xendit');
const prisma = require('../../lib/prisma');
const AppError = require('../../lib/AppError');

// Buat invoice Xendit untuk sebuah order
async function createInvoice(orderId, buyerId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', 'Order tidak ditemukan', 404);
  }

  if (order.buyerId !== buyerId) {
    throw new AppError('FORBIDDEN', 'Kamu tidak punya akses ke order ini', 403);
  }

  if (order.status !== 'PENDING') {
    throw new AppError(
      'INVALID_ORDER_STATUS',
      `Order dengan status ${order.status} tidak bisa dibuatkan invoice`,
      400
    );
  }

  // Kalau invoice sudah pernah dibuat, return yang lama saja
  if (order.xenditInvoiceId && order.paymentUrl) {
    return { paymentUrl: order.paymentUrl };
  }

  // Buat invoice di Xendit
  const invoice = await Invoice.createInvoice({
    data: {
      externalId: order.id, // ID order kita — dipakai untuk mapping balik saat webhook
      amount: order.totalAmount,
      payerEmail: order.buyer.email,
      description: `Pembayaran order TokoKu #${order.id.slice(0, 8)}`,
      invoiceDuration: 86400, // berlaku 24 jam
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      successRedirectUrl: `${process.env.CLIENT_URL}/orders/${order.id}/success`,
      failureRedirectUrl: `${process.env.CLIENT_URL}/orders/${order.id}/failed`,
    },
  });

  // Simpan invoice ID dan payment URL ke database
  await prisma.order.update({
    where: { id: order.id },
    data: {
      xenditInvoiceId: invoice.id,
      paymentUrl: invoice.invoiceUrl,
    },
  });

  return { paymentUrl: invoice.invoiceUrl };
}

// Handle webhook dari Xendit saat status payment berubah
async function handleWebhook(payload) {
  const { external_id: orderId, status } = payload;

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    // Order tidak ditemukan — log saja, jangan throw error
    // supaya Xendit tidak retry terus untuk order yang memang tidak ada
    console.error(`Webhook diterima untuk order yang tidak ditemukan: ${orderId}`);
    return { received: true };
  }

  // Xendit kirim status: PAID, EXPIRED, atau lainnya
  if (status === 'PAID' && order.status === 'PENDING') {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
    console.log(`Order ${order.id} berhasil dibayar`);
  }

  if (status === 'EXPIRED' && order.status === 'PENDING') {
    // Invoice expired — batalkan order dan kembalikan stok
    await prisma.$transaction(async (tx) => {
      const orderWithItems = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      await Promise.all(
        orderWithItems.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );
    });
    console.log(`Order ${order.id} expired, stok dikembalikan`);
  }

  return { received: true };
}

module.exports = { createInvoice, handleWebhook };