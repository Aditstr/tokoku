const productService = require('./product.service');
const { createProductSchema, updateProductSchema } = require('./product.validator');

async function getAllProducts(req, res, next) {
  try {
    // Query params: ?page=1&limit=10&search=laptop&categoryId=xxx
    const { page, limit, search, categoryId } = req.query;
    const result = await productService.getAllProducts({ page, limit, search, categoryId });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

async function getMyProducts(req, res, next) {
  try {
    const products = await productService.getMyProducts(req.user.userId);
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    // Validasi input dengan Zod
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input tidak valid',
          // Format error Zod jadi lebih readable
          details: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    const product = await productService.createProduct(req.user.userId, parsed.data);
    res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan',
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input tidak valid',
          details: parsed.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    const product = await productService.updateProduct(
      req.params.id,
      req.user.userId,
      parsed.data
    );

    res.json({
      success: true,
      message: 'Produk berhasil diperbarui',
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id, req.user.userId);
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};