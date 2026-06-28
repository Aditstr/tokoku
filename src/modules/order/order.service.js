const prisma = require('../../lib/prisma');
const AppError = require('../../lib/AppError');

// Checkout — buat order dari beberapa produk sekaligus
async function createOrder(buyerId, items) {
  const productIds = items.map((item) => item.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (products.length !== productIds.length) {
    const foundIds = products.map((p) => p.id);
    const notFound = productIds.filter((id) => !foundIds.includes(id));
    throw new AppError(
      'PRODUCT_NOT_FOUND',
      `Produk tidak ditemukan: ${notFound.join(', ')}`,
      404
    );
  }

  // Validasi stok awal sebelum masuk transaction
  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (product.stock < item.quantity) {
      throw new AppError(
        'INSUFFICIENT_STOCK',
        `Stok ${product.name} tidak cukup. Tersisa: ${product.stock}`,
        400
      );
    }
  }

  const totalAmount = items.reduce((sum, item) => {
    return sum + productMap.get(item.productId).price * item.quantity;
  }, 0);

  const order = await prisma.$transaction(async (tx) => {
    // Kurangi stok dengan kondisi WHERE stock >= quantity
    // Ini atomic — kalau dua request bersamaan, hanya satu yang berhasil
    for (const item of items) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity }, // hanya update kalau stok masih cukup
        },
        data: { stock: { decrement: item.quantity } },
      });

      // Kalau tidak ada baris yang terupdate, berarti stok sudah habis
      // diambil request lain yang lebih cepat
      if (updated.count === 0) {
        const product = productMap.get(item.productId);
        throw new AppError(
          'INSUFFICIENT_STOCK',
          `Stok ${product.name} tidak cukup`,
          400
        );
      }
    }

    // Buat order setelah semua stok berhasil dikurangi
    const newOrder = await tx.order.create({
      data: {
        buyerId,
        totalAmount,
        status: 'PENDING',
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: productMap.get(item.productId).price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    return newOrder;
  });

  return order;
}

// Ambil semua order milik buyer
async function getMyOrders(buyerId) {
  const orders = await prisma.order.findMany({
    where: { buyerId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
    },
  });

  return orders;
}

// Ambil detail satu order
async function getOrderById(orderId, buyerId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
      buyer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', 'Order tidak ditemukan', 404);
  }

  // Buyer hanya boleh lihat order miliknya sendiri
  if (order.buyerId !== buyerId) {
    throw new AppError('FORBIDDEN', 'Kamu tidak punya akses ke order ini', 403);
  }

  return order;
}

// Batalkan order
async function cancelOrder(orderId, buyerId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', 'Order tidak ditemukan', 404);
  }

  if (order.buyerId !== buyerId) {
    throw new AppError('FORBIDDEN', 'Kamu tidak punya akses ke order ini', 403);
  }

  // Hanya order PENDING yang bisa dibatalkan
  if (order.status !== 'PENDING') {
    throw new AppError(
      'CANNOT_CANCEL',
      `Order dengan status ${order.status} tidak bisa dibatalkan`,
      400
    );
  }

  // Transaction: batalkan order + kembalikan stok
  await prisma.$transaction(async (tx) => {
    // Update status order
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    // Kembalikan stok semua produk
    await Promise.all(
      order.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      )
    );
  });

  return { message: 'Order berhasil dibatalkan, stok produk sudah dikembalikan' };
}

// Seller: lihat semua order yang berisi produk miliknya
async function getSellerOrders(sellerId) {
  const orders = await prisma.order.findMany({
    where: {
      status: { not: 'CANCELLED' },
      items: {
        some: {
          product: { sellerId },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      buyer: {
        select: { id: true, name: true, email: true },
      },
      items: {
        // Hanya tampilkan item yang produknya milik seller ini
        where: {
          product: { sellerId },
        },
        include: {
          product: {
            select: { id: true, name: true, price: true },
          },
        },
      },
    },
  });

  return orders;
}

// Seller: update status order
async function updateOrderStatus(orderId, sellerId, newStatus) {
  // Validasi urutan status yang boleh
  const allowedTransitions = {
    PENDING: ['PAID'],
    PAID: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
  };

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      items: {
        some: { product: { sellerId } },
      },
    },
  });

  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', 'Order tidak ditemukan', 404);
  }

  const allowed = allowedTransitions[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError(
      'INVALID_STATUS_TRANSITION',
      `Status tidak bisa diubah dari ${order.status} ke ${newStatus}`,
      400
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  return updated;
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateOrderStatus,
};