const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const AppError = require('../../lib/AppError');

// Helper — buat access token dan refresh token
function generateTokens(userId, role) {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // access token berumur pendek
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // refresh token berumur panjang
  );

  return { accessToken, refreshToken };
}

// Register
async function register({ name, email, password, role }) {
  // Cek apakah email sudah dipakai
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('EMAIL_TAKEN', 'Email sudah digunakan', 409);
  }

  // Hash password — JANGAN simpan plaintext
  const hashedPassword = await bcrypt.hash(password, 12);

  // Simpan user baru
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: role || 'BUYER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    // select: true → field password tidak ikut di-return
  });

  return user;
}

// Login
async function login({ email, password }) {
  // Cari user berdasarkan email
  const user = await prisma.user.findUnique({ where: { email } });

  // Pesan error sengaja dibuat sama untuk email salah dan password salah
  // Supaya attacker tidak bisa tahu mana yang salah (user enumeration)
  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Email atau password salah', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('INVALID_CREDENTIALS', 'Email atau password salah', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

// Refresh token — dapat access token baru tanpa login ulang
async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError('NO_TOKEN', 'Refresh token tidak ditemukan', 401);
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('INVALID_TOKEN', 'Refresh token tidak valid atau kedaluwarsa', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User tidak ditemukan', 404);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

  return { accessToken, refreshToken: newRefreshToken };
}

module.exports = { register, login, refresh };