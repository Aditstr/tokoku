const { cloudinary } = require('../../lib/cloudinary');
const AppError = require('../../lib/AppError');

// Upload satu gambar
async function uploadImage(req, res, next) {
  try {
    // Kalau tidak ada file yang diupload
    if (!req.file) {
      throw new AppError('NO_FILE', 'Tidak ada file yang diupload', 400);
    }

    // req.file.path berisi URL Cloudinary setelah upload berhasil
    res.status(201).json({
      success: true,
      message: 'Gambar berhasil diupload',
      data: {
        url:       req.file.path,       // URL gambar di Cloudinary
        public_id: req.file.filename,   // ID untuk hapus gambar nanti
      },
    });
  } catch (err) {
    next(err);
  }
}

// Hapus gambar dari Cloudinary
async function deleteImage(req, res, next) {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      throw new AppError('NO_PUBLIC_ID', 'public_id wajib diisi', 400);
    }

    await cloudinary.uploader.destroy(public_id);

    res.json({
      success: true,
      message: 'Gambar berhasil dihapus',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImage, deleteImage };