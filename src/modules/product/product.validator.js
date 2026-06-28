const { z } = require('zod');

const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Nama produk wajib diisi' })
    .min(3, 'Nama produk minimal 3 karakter')
    .max(100, 'Nama produk maksimal 100 karakter'),

  description: z
    .string()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional(),

  price: z
    .number({ required_error: 'Harga wajib diisi' })
    .positive('Harga harus lebih dari 0')
    .int('Harga harus berupa bilangan bulat'),

  stock: z
    .number()
    .int('Stok harus berupa bilangan bulat')
    .min(0, 'Stok tidak boleh negatif')
    .default(0),

  imageUrl: z
    .string()
    .url('Format URL tidak valid')
    .optional(),

  categoryId: z
    .string({ required_error: 'Kategori wajib dipilih' })
    .uuid('Format kategori tidak valid'),
});

const updateProductSchema = createProductSchema.partial();
// .partial() membuat semua field opsional untuk update

module.exports = { createProductSchema, updateProductSchema };