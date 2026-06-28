const { PrismaClient } = require('@prisma/client');

// Pakai singleton pattern — satu instance Prisma untuk seluruh app
// Mencegah koneksi database menumpuk saat hot-reload di development
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});

module.exports = prisma;