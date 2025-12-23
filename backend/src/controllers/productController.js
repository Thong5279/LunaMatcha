const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// Lấy danh sách sản phẩm
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo sản phẩm mới
const createProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng upload hình ảnh' });
    }

    const { name, priceSmall, priceLarge, description } = req.body;

    if (!name || !priceSmall || !priceLarge) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const product = new Product({
      name,
      priceSmall: parseFloat(priceSmall),
      priceLarge: parseFloat(priceLarge),
      image: req.file.path,
      cloudinaryId: req.file.filename,
      description: description || '',
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, priceSmall, priceLarge, description } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Nếu có ảnh mới, xóa ảnh cũ trên Cloudinary
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(product.cloudinaryId);
      } catch (error) {
        console.error('Lỗi xóa ảnh cũ:', error);
      }
      product.image = req.file.path;
      product.cloudinaryId = req.file.filename;
    }

    if (name) product.name = name;
    if (priceSmall !== undefined) product.priceSmall = parseFloat(priceSmall);
    if (priceLarge !== undefined) product.priceLarge = parseFloat(priceLarge);
    if (description !== undefined) product.description = description;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Xóa ảnh trên Cloudinary
    try {
      await cloudinary.uploader.destroy(product.cloudinaryId);
    } catch (error) {
      console.error('Lỗi xóa ảnh trên Cloudinary:', error);
    }

    await Product.findByIdAndDelete(id);
    res.json({ message: 'Đã xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};

