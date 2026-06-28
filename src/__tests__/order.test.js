const request = require('supertest');
const app = require('../app');
const prisma = require('../lib/prisma');
const { createUserAndLogin, createCategory, createProduct } = require('./helpers');

describe('Order API', () => {

  describe('POST /api/v1/orders — checkout', () => {

    it('buyer berhasil checkout dan stok berkurang', async () => {
      const category = await createCategory();
      const { user: seller } = await createUserAndLogin({ role: 'SELLER' });
      const { token: buyerToken } = await createUserAndLogin({ role: 'BUYER' });
      const product = await createProduct(seller.id, category.id, {
        price: 100000, stock: 10,
      });

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ items: [{ productId: product.id, quantity: 3 }] });

      expect(res.status).toBe(201);
      expect(res.body.data.totalAmount).toBe(300000);

      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct.stock).toBe(7);
    });

    it('gagal checkout jika stok tidak cukup', async () => {
      const category = await createCategory();
      const { user: seller } = await createUserAndLogin({ role: 'SELLER' });
      const { token: buyerToken } = await createUserAndLogin({ role: 'BUYER' });
      const product = await createProduct(seller.id, category.id, { stock: 2 });

      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ items: [{ productId: product.id, quantity: 5 }] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

      const productCheck = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(productCheck.stock).toBe(2);
    });

    it('hanya satu yang berhasil saat dua checkout bersamaan untuk stok terakhir', async () => {
      const category = await createCategory();
      const { user: seller } = await createUserAndLogin({ role: 'SELLER' });
      const { token: buyer1Token } = await createUserAndLogin({ role: 'BUYER' });
      const { token: buyer2Token } = await createUserAndLogin({ role: 'BUYER' });
      const product = await createProduct(seller.id, category.id, { stock: 1 });

      const [res1, res2] = await Promise.all([
        request(app)
          .post('/api/v1/orders')
          .set('Authorization', `Bearer ${buyer1Token}`)
          .send({ items: [{ productId: product.id, quantity: 1 }] }),
        request(app)
          .post('/api/v1/orders')
          .set('Authorization', `Bearer ${buyer2Token}`)
          .send({ items: [{ productId: product.id, quantity: 1 }] }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 400]);

      const finalProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(finalProduct.stock).toBe(0);
    });

  });

  describe('PATCH /api/v1/orders/:id/cancel', () => {

    it('buyer berhasil cancel order PENDING dan stok kembali', async () => {
      const category = await createCategory();
      const { user: seller } = await createUserAndLogin({ role: 'SELLER' });
      const { token: buyerToken } = await createUserAndLogin({ role: 'BUYER' });
      const product = await createProduct(seller.id, category.id, { stock: 5 });

      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ items: [{ productId: product.id, quantity: 2 }] });

      const cancelRes = await request(app)
        .patch(`/api/v1/orders/${orderRes.body.data.id}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(cancelRes.status).toBe(200);

      const restoredProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(restoredProduct.stock).toBe(5);
    });

    it('tidak bisa cancel order yang sudah PAID', async () => {
      const category = await createCategory();
      const { user: seller, token: sellerToken } = await createUserAndLogin({ role: 'SELLER' });
      const { token: buyerToken } = await createUserAndLogin({ role: 'BUYER' });
      const product = await createProduct(seller.id, category.id, { stock: 5 });

      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ items: [{ productId: product.id, quantity: 1 }] });

      await request(app)
        .patch(`/api/v1/orders/seller/${orderRes.body.data.id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'PAID' });

      const cancelRes = await request(app)
        .patch(`/api/v1/orders/${orderRes.body.data.id}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.error.code).toBe('CANNOT_CANCEL');
    });

  });

  describe('PATCH /api/v1/orders/seller/:id/status', () => {

    it('seller berhasil update status PENDING ke PAID', async () => {
      const category = await createCategory();
      const { user: seller, token: sellerToken } = await createUserAndLogin({ role: 'SELLER' });
      const { token: buyerToken } = await createUserAndLogin({ role: 'BUYER' });
      const product = await createProduct(seller.id, category.id, { stock: 5 });

      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ items: [{ productId: product.id, quantity: 1 }] });

      const res = await request(app)
        .patch(`/api/v1/orders/seller/${orderRes.body.data.id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'PAID' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PAID');
    });

    it('seller tidak bisa skip urutan status', async () => {
      const category = await createCategory();
      const { user: seller, token: sellerToken } = await createUserAndLogin({ role: 'SELLER' });
      const { token: buyerToken } = await createUserAndLogin({ role: 'BUYER' });
      const product = await createProduct(seller.id, category.id, { stock: 5 });

      const orderRes = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ items: [{ productId: product.id, quantity: 1 }] });

      const res = await request(app)
        .patch(`/api/v1/orders/seller/${orderRes.body.data.id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'DELIVERED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

  });

});