const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const logger = require('./lib/logger');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes    = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/product/product.routes');
const orderRoutes   = require('./modules/order/order.routes');
const uploadRoutes  = require('./modules/upload/upload.routes');
const paymentRoutes = require('./modules/payment/payment.routes');

const app = express();

// ─── Security middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── General middleware ───────────────────────────────────────
app.use(logger);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// ─── Rate limiting — dinonaktifkan saat test ─────────────────
const authRateLimit = process.env.NODE_ENV !== 'test'
  ? authLimiter
  : (req, res, next) => next();

if (process.env.NODE_ENV !== 'test') {
  app.use(globalLimiter);
}

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/v1/auth',     authRateLimit, authRoutes); // ← pakai authRateLimit, bukan authLimiter
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders',   orderRoutes);
app.use('/api/v1/upload',   uploadRoutes);
app.use('/api/v1/payments', paymentRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const prisma = require('./lib/prisma');
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()) + 's',
    });
  } catch {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} tidak ditemukan`,
    },
  });
});

// ─── Error handler — HARUS paling bawah ──────────────────────
app.use(errorHandler);

module.exports = app;