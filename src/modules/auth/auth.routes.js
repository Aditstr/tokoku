const { Router } = require('express');
const authController = require('./auth.controller');
const validate = require('../../middleware/validate');
const { registerSchema, loginSchema } = require('./auth.validator');

const router = Router();

// Validasi input langsung di layer route — sebelum masuk controller
router.post('/register', validate(registerSchema), authController.register);
router.post('/login',    validate(loginSchema),    authController.login);
router.post('/refresh',  authController.refresh);
router.post('/logout',   authController.logout);
router.get('/verify-email',        authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);


module.exports = router;