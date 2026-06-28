const { Prisma } = require('@prisma/client');

function errorHandler(err, req, res, next) {
  // Log error di server — jangan sampai error ditelan tanpa jejak
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${new Date().toISOString()}] ERROR:`, {
      message: err.message,
      code: err.code,
      path: `${req.method} ${req.path}`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }

  // Handle Prisma errors — ubah jadi response yang readable
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 = unique constraint violation
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `${field} sudah digunakan`,
        },
      });
    }

    // P2025 = record not found saat update/delete
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Data tidak ditemukan',
        },
      });
    }
  }

  // Handle AppError (error buatan kita sendiri)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Handle error tidak terduga — jangan expose detail ke client
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan pada server',
      // Detail hanya muncul saat development
      ...(process.env.NODE_ENV === 'development' && {
        detail: err.message,
      }),
    },
  });
}

module.exports = errorHandler;