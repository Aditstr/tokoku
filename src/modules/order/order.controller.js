const orderService = require('./order.service');
const { createOrderSchema, updateStatusSchema } = require('./order.validator');

// Helper validasi — supaya tidak tulis ulang di tiap controller
function validate(schema, data, res) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input tidak valid',
        details: parsed.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return null;
  }
  return parsed.data;
}

async function createOrder(req, res, next) {
  try {
    const data = validate(createOrderSchema, req.body, res);
    if (!data) return;

    const order = await orderService.createOrder(req.user.userId, data.items);

    res.status(201).json({
      success: true,
      message: 'Order berhasil dibuat',
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await orderService.getMyOrders(req.user.userId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.userId);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const result = await orderService.cancelOrder(req.params.id, req.user.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getSellerOrders(req, res, next) {
  try {
    const orders = await orderService.getSellerOrders(req.user.userId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const data = validate(updateStatusSchema, req.body, res);
    if (!data) return;

    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.user.userId,
      data.status
    );

    res.json({
      success: true,
      message: `Status order berhasil diubah ke ${data.status}`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateOrderStatus,
};