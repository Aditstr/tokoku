const { z } = require('zod');

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Format productId tidak valid'),
        quantity: z
          .number()
          .int('Quantity harus bilangan bulat')
          .positive('Quantity harus lebih dari 0')
          .max(100, 'Maksimal 100 item per produk'),
      })
    )
    .min(1, 'Order harus berisi minimal 1 produk')
    .max(20, 'Maksimal 20 produk dalam satu order'),
});

const updateStatusSchema = z.object({
  status: z.enum(['PAID', 'SHIPPED', 'DELIVERED'], {
    errorMap: () => ({ message: 'Status tidak valid' }),
  }),
});

module.exports = { createOrderSchema, updateStatusSchema };