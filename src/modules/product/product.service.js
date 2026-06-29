const prisma = require('../../lib/prisma');
const AppError = require('../../lib/AppError');
const { cloudinary } = require('../../lib/cloudinary');

// Ambil semua produk (publik)
// Support filter by category, search by name, dan pagination
async function getAllProducts({ page = 1, limit = 10, search, categoryId }) {
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    // Kalau ada search, filter by name (case-insensitive)
    ...(search && {
      name: { contains: search, mode: 'insensitive' },
    }),
    // Kalau ada categoryId, filter by kategori
    ...(categoryId && { categoryId }),
  };

  // Jalankan dua query sekaligus — data dan total count
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
        createdAt: true,
        seller: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Ambil satu produk by ID (publik)
async function getProductById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      imageUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      seller: {
        select: { id: true, name: true, email: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!product) {
    throw new AppError('PRODUCT_NOT_FOUND', 'Produk tidak ditemukan', 404);
  }

  return product;
}

// Ambil produk milik seller yang sedang login
async function getMyProducts(sellerId) {
  const products = await prisma.product.findMany({
    where: { sellerId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      isActive: true,
      createdAt: true,
      category: {
        select: { id: true, name: true },
      },
    },
  });

  return products;
}

// Buat produk baru (hanya seller)
async function createProduct(sellerId, { name, description, price, stock, imageUrl, categoryId }) {
  // Pastikan category ada
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AppError('CATEGORY_NOT_FOUND', 'Kategori tidak ditemukan', 404);
  }

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      imageUrl,
      sellerId,
      categoryId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      imageUrl: true,
      createdAt: true,
      category: { select: { id: true, name: true } },
    },
  });

  return product;
}

// Update produk (hanya seller pemilik)
async function updateProduct(productId, sellerId, data) {
  // Cek produk ada dan milik seller ini
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new AppError('PRODUCT_NOT_FOUND', 'Produk tidak ditemukan', 404);
  }

  // Ini krusial — seller tidak boleh edit produk milik seller lain
  if (product.sellerId !== sellerId) {
    throw new AppError('FORBIDDEN', 'Kamu tidak punya akses ke produk ini', 403);
  }

  // Kalau ada categoryId baru, validasi dulu
  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new AppError('CATEGORY_NOT_FOUND', 'Kategori tidak ditemukan', 404);
    }
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price && { price: Number(data.price) }),
      ...(data.stock !== undefined && { stock: Number(data.stock) }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return updated;
}

// Hapus produk (hanya seller pemilik)
async function deleteProduct(productId, sellerId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError('PRODUCT_NOT_FOUND', 'Produk tidak ditemukan', 404);
  }

  if (product.sellerId !== sellerId) {
    throw new AppError('FORBIDDEN', 'Kamu tidak punya akses ke produk ini', 403);
  }

  // Hapus gambar dari Cloudinary kalau ada
  if (product.imageUrl) {
    try {
      // Extract public_id dari URL Cloudinary
      const parts = product.imageUrl.split('/');
      const filename = parts[parts.length - 1].split('.')[0];
      const folder = parts[parts.length - 2];
      const public_id = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(public_id);
    } catch {
      // Kalau gagal hapus gambar, tetap lanjut hapus produk
      console.error('Gagal hapus gambar dari Cloudinary');
    }
  }

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });

  return { message: 'Produk berhasil dihapus' };
}

module.exports = {
  getAllProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};