const request = require('supertest');
const app = require('../app');
const { createUserAndLogin, createCategory, createProduct } = require('./helpers');

describe('Product API', () => {

  describe('GET /api/v1/products', () => {

    it('berhasil ambil daftar produk tanpa token', async () => {
      const category = await createCategory();
      const { user: seller } = await createUserAndLogin({ role: 'SELLER'});
      await createProduct(seller.id, category.id);
      await createProduct(seller.id, category.id, {
        name: 'Produk Kedua',
      });

      const res = await request(app).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it('berhasil filter produk berdasarkan search', async () => {
      const category = await createCategory();
      const { user: seller } = await createUserAndLogin({
        email: 'seller2@test.com', role: 'SELLER',
      });
      await createProduct(seller.id, category.id, { name: 'Laptop Gaming' });
      await createProduct(seller.id, category.id, { name: 'Sepatu Lari' });

      const res = await request(app).get('/api/v1/products?search=laptop');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Laptop Gaming');
    });

  });

  describe('POST /api/v1/products', () => {

    it('seller berhasil buat produk baru', async () => {
      const category = await createCategory();
      const { token } = await createUserAndLogin({
        email: 'seller@test.com', role: 'SELLER',
      });

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Produk Baru',
          description: 'Deskripsi produk',
          price: 50000,
          stock: 10,
          categoryId: category.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Produk Baru');
      expect(res.body.data.price).toBe(50000);
    });

    it('buyer tidak bisa buat produk', async () => {
      const category = await createCategory();
      const { token } = await createUserAndLogin({
        email: 'buyer@test.com', role: 'BUYER',
      });

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Produk Coba',
          price: 50000,
          stock: 5,
          categoryId: category.id,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('gagal buat produk tanpa token', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({ name: 'Test', price: 1000, stock: 1 });

      expect(res.status).toBe(401);
    });

    it('seller tidak bisa edit produk milik seller lain', async () => {
      const category = await createCategory();
      const { user: seller1 } = await createUserAndLogin({
        email: 'seller1@test.com', role: 'SELLER',
      });
      const { token: token2 } = await createUserAndLogin({
        email: 'seller2@test.com', role: 'SELLER',
      });

      // Seller 1 buat produk
      const product = await createProduct(seller1.id, category.id);

      // Seller 2 coba edit produk seller 1
      const res = await request(app)
        .put(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ price: 999 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

  });

});