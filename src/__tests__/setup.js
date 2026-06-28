const prisma = require('../lib/prisma');

// Set environment SEBELUM apapun berjalan
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

beforeEach(async () => {
  // Bersihkan data SEBELUM tiap test — lebih andal dari afterEach
  // Urutan penting: hapus child dulu sebelum parent (foreign key)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});