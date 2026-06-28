const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Buat kategori
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'elektronik' },
      update: {},
      create: { name: 'Elektronik', slug: 'elektronik' },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion' },
      update: {},
      create: { name: 'Fashion', slug: 'fashion' },
    }),
  ]);

  // Buat user seller
  const seller = await prisma.user.upsert({
    where: { email: 'seller@tokoku.com' },
    update: {},
    create: {
      name: 'Budi Seller',
      email: 'seller@tokoku.com',
      password: await bcrypt.hash('password123', 12),
      role: 'SELLER',
    },
  });

  // Buat user buyer
  await prisma.user.upsert({
    where: { email: 'buyer@tokoku.com' },
    update: {},
    create: {
      name: 'Ani Buyer',
      email: 'buyer@tokoku.com',
      password: await bcrypt.hash('password123', 12),
      role: 'BUYER',
    },
  });

  // Buat produk
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Laptop Gaming ASUS',
        description: 'Laptop untuk gaming dan coding',
        price: 12000000,
        stock: 10,
        sellerId: seller.id,
        categoryId: categories[0].id,
      },
      {
        name: 'Kaos Polos Cotton',
        description: 'Kaos polos berbahan cotton combed 30s',
        price: 85000,
        stock: 50,
        sellerId: seller.id,
        categoryId: categories[1].id,
      },
    ],
  });

  console.log('✅ Seed selesai');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());