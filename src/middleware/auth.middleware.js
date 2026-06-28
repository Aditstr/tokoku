const jwt = require('jsonwebtoken');
const AppError = require('../lib/AppError');

function requireAuth(req, res, next) {
  // Ambil token dari header Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('NO_TOKEN', 'Token tidak ditemukan', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, role } tersedia di semua route selanjutnya
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('TOKEN_EXPIRED', 'Token kedaluwarsa', 401));
    }
    return next(new AppError('INVALID_TOKEN', 'Token tidak valid', 401));
  }
}

// Middleware untuk cek role — pakai setelah requireAuth
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('FORBIDDEN', 'Kamu tidak punya akses ke resource ini', 403)
      );
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };