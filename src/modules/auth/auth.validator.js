const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Nama wajib diisi' })
    .min(2, 'Nama minimal 2 karakter')
    .max(100),

  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Format email tidak valid'),

  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(8, 'Password minimal 8 karakter'),

  role: z
    .enum(['BUYER', 'SELLER'])
    .default('BUYER'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Format email tidak valid'),

  password: z
    .string({ required_error: 'Password wajib diisi' }),
});

module.exports = { registerSchema, loginSchema };