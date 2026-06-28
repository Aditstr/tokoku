const request = require('supertest');
const app = require('../app');
const prisma = require('../lib/prisma');
const { createUserAndLogin } = require('./helpers');

describe('Auth API', () => {

  describe('POST /api/v1/auth/register', () => {

    it('berhasil register user baru', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Budi Santoso',
          email: 'budi@test.com',
          password: 'password123',
          role: 'BUYER',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('budi@test.com');
      // Pastikan password TIDAK ada di response
      expect(res.body.data.password).toBeUndefined();
    });

    it('gagal register jika email sudah dipakai', async () => {
      // Buat user pertama
      await createUserAndLogin({ email: 'sama@test.com' });

      // Coba register dengan email yang sama
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'User Lain',
          email: 'sama@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('gagal register jika field tidak lengkap', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'tanpa-nama@test.com' }); // tidak ada name dan password

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });

    it('gagal register jika email tidak valid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test',
          email: 'bukan-email',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.details[0].field).toBe('email');
    });

  });

  describe('POST /api/v1/auth/login', () => {

    it('berhasil login dan dapat access token', async () => {
      await createUserAndLogin({ email: 'login@test.com' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(typeof res.body.data.accessToken).toBe('string');
    });

    it('gagal login jika password salah', async () => {
      await createUserAndLogin({ email: 'user@test.com' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@test.com', password: 'passwordSalah' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('gagal login jika email tidak terdaftar', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'tidakada@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      // Pesan error harus sama dengan password salah — cegah user enumeration
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

  });

});