const Recipe = require('../models/Recipe');
const mongoose = require('mongoose');

// Lấy công thức theo productId và size
const getRecipe = async (req, res) => {
  try {
    const { productId, size } = req.params;
    
    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'ProductId không hợp lệ' });
    }
    
    if (!size || !['small', 'large'].includes(size)) {
      return res.status(400).json({ message: 'Size phải là small hoặc large' });
    }
    
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const recipe = await Recipe.findOne({ productId: productObjectId, size }).populate('productId');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Không tìm thấy công thức' });
    }
    
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả công thức của một sản phẩm (cả small và large)
const getRecipesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'ProductId không hợp lệ' });
    }
    
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const recipes = await Recipe.find({ productId: productObjectId }).populate('productId');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy công thức theo nhiều productId (bulk)
const getRecipesByProductIds = async (req, res) => {
  try {
    const { productIds } = req.query;
    
    if (!productIds) {
      return res.status(400).json({ message: 'Vui lòng cung cấp productIds' });
    }
    
    const ids = productIds.split(',').filter(id => id.trim());
    
    if (ids.length === 0) {
      return res.json([]);
    }
    
    const recipes = await Recipe.find({
      productId: { $in: ids }
    }).populate('productId');
    
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo hoặc cập nhật công thức
const createOrUpdateRecipe = async (req, res) => {
  try {
    const { productId } = req.params;
    const { size, ingredients } = req.body;
    
    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'ProductId không hợp lệ' });
    }
    
    if (!size || !['small', 'large'].includes(size)) {
      return res.status(400).json({ message: 'Size phải là small hoặc large' });
    }
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một nguyên liệu' });
    }
    
    // Validate ingredients
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      
      // Kiểm tra các field bắt buộc
      if (!ingredient.name || !ingredient.hasOwnProperty('amount') || !ingredient.unit) {
        return res.status(400).json({ 
          message: `Nguyên liệu thứ ${i + 1}: Mỗi nguyên liệu phải có name, amount và unit` 
        });
      }
      
      // Validate name: trim và kiểm tra không rỗng
      const trimmedName = typeof ingredient.name === 'string' ? ingredient.name.trim() : '';
      if (!trimmedName) {
        return res.status(400).json({ 
          message: `Nguyên liệu thứ ${i + 1}: Tên nguyên liệu không được để trống` 
        });
      }
      
      // Validate amount: phải là number và không phải NaN
      const amount = typeof ingredient.amount === 'number' 
        ? ingredient.amount 
        : parseFloat(ingredient.amount);
      
      if (isNaN(amount) || !isFinite(amount)) {
        return res.status(400).json({ 
          message: `Nguyên liệu thứ ${i + 1}: Số lượng nguyên liệu không hợp lệ` 
        });
      }
      
      if (amount <= 0) {
        return res.status(400).json({ 
          message: `Nguyên liệu thứ ${i + 1}: Số lượng nguyên liệu phải lớn hơn 0` 
        });
      }
      
      // Validate unit
      if (!['ml', 'g'].includes(ingredient.unit)) {
        return res.status(400).json({ 
          message: `Nguyên liệu thứ ${i + 1}: Đơn vị chỉ được phép là ml hoặc g` 
        });
      }
      
      // Cập nhật lại ingredient với dữ liệu đã được validate và trim
      ingredients[i] = {
        name: trimmedName,
        amount: amount,
        unit: ingredient.unit,
      };
    }
    
    // Convert productId sang ObjectId để đảm bảo query đúng
    const productObjectId = new mongoose.Types.ObjectId(productId);
    
    // Tìm công thức hiện có hoặc tạo mới
    let recipe = await Recipe.findOne({ productId: productObjectId, size });
    
    if (recipe) {
      // Cập nhật
      recipe.ingredients = ingredients;
      await recipe.save();
      res.json(recipe);
    } else {
      // Tạo mới
      recipe = new Recipe({
        productId: productObjectId,
        size,
        ingredients,
      });
      await recipe.save();
      res.status(201).json(recipe);
    }
  } catch (error) {
    // Log chi tiết lỗi để debug
    console.error('Error in createOrUpdateRecipe:', {
      productId,
      size,
      error: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Sản phẩm này đã có công thức cho size này' });
    }
    
    // Xử lý lỗi validation của mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Dữ liệu không hợp lệ', 
        errors: messages 
      });
    }
    
    // Xử lý lỗi CastError (ObjectId không hợp lệ)
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
    
    res.status(500).json({ message: 'Có lỗi xảy ra khi lưu công thức. Vui lòng thử lại sau.' });
  }
};

// Xóa công thức
const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await Recipe.findById(id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Không tìm thấy công thức' });
    }
    
    await Recipe.findByIdAndDelete(id);
    res.json({ message: 'Đã xóa công thức thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRecipe,
  getRecipesByProduct,
  getRecipesByProductIds,
  createOrUpdateRecipe,
  deleteRecipe,
};

