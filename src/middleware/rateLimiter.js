const rateLimit = require('express-rate-limit');

// Limiter umum — untuk semua endpoint
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,                  // maksimal 100 request per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak request. Coba lagi dalam 15 menit.',
    },
  },
});

// Limiter ketat — khusus endpoint auth (login, register)
// Mencegah brute force password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,                   // hanya 10 percobaan per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
    },
  },
});

module.exports = { globalLimiter, authLimiter };