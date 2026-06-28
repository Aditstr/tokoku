const authService = require('./auth.service');

async function register(req, res, next) {
  try {
    // req.validated sudah berisi data yang tervalidasi dari middleware
    const user = await authService.register(req.validated);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: user,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.validated);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    const result = await authService.refresh(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { accessToken: result.accessToken } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logout berhasil' });
}

module.exports = { register, login, refresh, logout };