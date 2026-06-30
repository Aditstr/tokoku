const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const AppError = require('../../lib/AppError');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../../lib/email');

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
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('EMAIL_TAKEN', 'Email sudah digunakan', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate token verifikasi yang unik dan aman
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'BUYER',
      verificationToken,
      tokenExpiresAt,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // Kirim email verifikasi — jangan sampai gagal kirim email menggagalkan register
  try {
    await sendVerificationEmail(user.email, user.name, verificationToken);
  } catch (err) {
    console.error('Gagal kirim email verifikasi:', err.message);
    // Tidak throw error — user tetap berhasil register, bisa resend nanti
  }

  return user;
}

// Login
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('INVALID_CREDENTIALS', 'Email atau password salah', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('INVALID_CREDENTIALS', 'Email atau password salah', 401);
  }

  // Cek verifikasi email
  if (!user.emailVerified) {
    throw new AppError(
      'EMAIL_NOT_VERIFIED',
      'Email belum diverifikasi. Cek inbox atau spam kamu.',
      403
    );
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

async function verifyEmail(token) {
  if (!token) {
    throw new AppError('NO_TOKEN', 'Token verifikasi tidak ditemukan', 400);
  }

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
  });

  if (!user) {
    throw new AppError('INVALID_TOKEN', 'Token verifikasi tidak valid', 400);
  }

  if (user.emailVerified) {
    return { message: 'Email sudah terverifikasi sebelumnya' };
  }

  // Cek apakah token sudah expired
  if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
    throw new AppError(
      'TOKEN_EXPIRED',
      'Token verifikasi sudah kedaluwarsa. Minta kirim ulang.',
      400
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null, // hapus token setelah dipakai
      tokenExpiresAt: null,
    },
  });

  return { message: 'Email berhasil diverifikasi. Kamu sekarang bisa login.' };
}

async function resendVerification(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'Email tidak terdaftar', 404);
  }

  if (user.emailVerified) {
    throw new AppError('ALREADY_VERIFIED', 'Email kamu sudah terverifikasi', 400);
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, tokenExpiresAt },
  });

  await sendVerificationEmail(user.email, user.name, verificationToken);

  return { message: 'Email verifikasi sudah dikirim ulang' };
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

module.exports = { register, login, refresh, verifyEmail, resendVerification };