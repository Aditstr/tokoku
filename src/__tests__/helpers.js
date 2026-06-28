const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const prisma = require('../lib/prisma');

// Counter untuk generate email unik tiap pemanggilan
// Mencegah unique constraint error kalau createUserAndLogin dipanggil
// beberapa kali dalam satu test tanpa override email
let userCounter = 0;
let categoryCounter = 0;

// Reset counter sebelum tiap test
beforeEach(() => {
  userCounter = 0;
  categoryCounter = 0;
});

async function createUserAndLogin(overrides = {}) {
  userCounter++;

  const userData = {
    name: `Test User ${userCounter}`,
    email: `user${userCounter}@test.com`, // email unik otomatis
    password: 'password123',
    role: 'BUYER',
    ...overrides,
  };

  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: await bcrypt.hash(userData.password, 4), // rounds rendah agar test cepat
      role: userData.role,
    },
  });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: userData.email, password: userData.password });

  // Kalau login gagal, tampilkan response untuk debugging
  if (!loginRes.body.data) {
    console.error('Login gagal:', JSON.stringify(loginRes.body, null, 2));
    throw new Error(`Login gagal untuk user ${userData.email}`);
  }

  return {
    user,
    token: loginRes.body.data.accessToken,
  };
}

async function createCategory(overrides = {}) {
  categoryCounter++;

  return prisma.category.create({
    data: {
      name: `Kategori ${categoryCounter}`,   // nama unik otomatis
      slug: `kategori-${categoryCounter}`,   // slug unik otomatis
      ...overrides,
    },
  });
}

// Buat produk langsung via database
async function createProduct(sellerId, categoryId, overrides = {}) {
  return prisma.product.create({
    data: {
      name: 'Laptop Test',
      description: 'Deskripsi laptop test',
      price: 10000000,
      stock: 10,
      sellerId,
      categoryId,
      ...overrides,
    },
  });
}

module.exports = { createUserAndLogin, createCategory, createProduct };