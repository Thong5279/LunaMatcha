const Recipe = require('../models/Recipe');
const mongoose = require('mongoose');

// Lấy công thức của một sản phẩm (trả về 1 document chứa cả small và large)
const getRecipesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'ProductId không hợp lệ' });
    }
    
    const productObjectId = new mongoose.Types.ObjectId(productId);
    const recipe = await Recipe.findOne({ productId: productObjectId }).populate('productId');
    
    // Trả về null nếu không tìm thấy (không phải 404 vì có thể chưa tạo recipe)
    res.json(recipe || null);
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

// Helper function để validate ingredients array
const validateIngredients = (ingredients, sizeType) => {
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error(`Vui lòng cung cấp ít nhất một nguyên liệu cho size ${sizeType}`);
  }
  
  const validatedIngredients = [];
  
  for (let i = 0; i < ingredients.length; i++) {
    const ingredient = ingredients[i];
    
    // Kiểm tra các field bắt buộc
    if (!ingredient.name || !ingredient.hasOwnProperty('amount') || !ingredient.unit) {
      throw new Error(`Nguyên liệu thứ ${i + 1} (${sizeType}): Mỗi nguyên liệu phải có name, amount và unit`);
    }
    
    // Validate name: trim và kiểm tra không rỗng
    const trimmedName = typeof ingredient.name === 'string' ? ingredient.name.trim() : '';
    if (!trimmedName) {
      throw new Error(`Nguyên liệu thứ ${i + 1} (${sizeType}): Tên nguyên liệu không được để trống`);
    }
    
    // Validate amount: phải là number và không phải NaN
    const amount = typeof ingredient.amount === 'number' 
      ? ingredient.amount 
      : parseFloat(ingredient.amount);
    
    if (isNaN(amount) || !isFinite(amount)) {
      throw new Error(`Nguyên liệu thứ ${i + 1} (${sizeType}): Số lượng nguyên liệu không hợp lệ`);
    }
    
    if (amount <= 0) {
      throw new Error(`Nguyên liệu thứ ${i + 1} (${sizeType}): Số lượng nguyên liệu phải lớn hơn 0`);
    }
    
    // Validate unit
    if (!['ml', 'g'].includes(ingredient.unit)) {
      throw new Error(`Nguyên liệu thứ ${i + 1} (${sizeType}): Đơn vị chỉ được phép là ml hoặc g`);
    }
    
    // Thêm vào validated ingredients
    validatedIngredients.push({
      name: trimmedName,
      amount: amount,
      unit: ingredient.unit,
    });
  }
  
  return validatedIngredients;
};

// Tạo hoặc cập nhật công thức (lưu cả 2 sizes trong 1 document)
const createOrUpdateRecipe = async (req, res) => {
  try {
    const { productId } = req.params;
    const { ingredientsSmall, ingredientsLarge } = req.body;
    
    // Log request để debug
    console.log('createOrUpdateRecipe called:', {
      productId,
      ingredientsSmallCount: ingredientsSmall?.length,
      ingredientsLargeCount: ingredientsLarge?.length,
    });
    
    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      console.error('Invalid productId:', productId);
      return res.status(400).json({ message: 'ProductId không hợp lệ' });
    }
    
    // Validate ingredientsSmall và ingredientsLarge
    let validatedIngredientsSmall, validatedIngredientsLarge;
    
    try {
      validatedIngredientsSmall = validateIngredients(ingredientsSmall, 'nhỏ');
      validatedIngredientsLarge = validateIngredients(ingredientsLarge, 'lớn');
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    // Convert productId sang ObjectId
    const productObjectId = new mongoose.Types.ObjectId(productId);
    
    console.log('Attempting to find/update recipe:', {
      productId: productObjectId,
      ingredientsSmallCount: validatedIngredientsSmall.length,
      ingredientsLargeCount: validatedIngredientsLarge.length,
    });
    
    // Dùng findOneAndUpdate với upsert để đảm bảo atomic operation
    const recipe = await Recipe.findOneAndUpdate(
      { productId: productObjectId },
      {
        productId: productObjectId,
        ingredientsSmall: validatedIngredientsSmall,
        ingredientsLarge: validatedIngredientsLarge,
      },
      {
        upsert: true, // Tạo mới nếu không tìm thấy
        new: true, // Trả về document sau khi update
        runValidators: true, // Chạy validation
      }
    ).populate('productId');
    
    console.log('Recipe saved successfully:', recipe._id);
    
    // Trả về 201 nếu là tạo mới, 200 nếu là cập nhật
    const isNew = !recipe.createdAt || recipe.createdAt.getTime() === recipe.updatedAt.getTime();
    return res.status(isNew ? 201 : 200).json(recipe);
  } catch (error) {
    // Log chi tiết lỗi để debug
    console.error('Error in createOrUpdateRecipe:', {
      productId: req.params?.productId,
      ingredientsSmall: req.body?.ingredientsSmall,
      ingredientsLarge: req.body?.ingredientsLarge,
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack,
      errorKeys: error.keyPattern,
      errorKeysValue: error.keyValue,
    });
    
    // Đảm bảo luôn trả về JSON, không phải HTML
    res.setHeader('Content-Type', 'application/json');
    
    // Xử lý duplicate key error (unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Sản phẩm này đã có công thức',
      });
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
      return res.status(400).json({ 
        message: 'Dữ liệu không hợp lệ',
        details: error.message 
      });
    }
    
    // Xử lý lỗi khác - luôn trả về JSON
    return res.status(500).json({ 
      message: 'Có lỗi xảy ra khi lưu công thức. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
  getRecipesByProduct,
  getRecipesByProductIds,
  createOrUpdateRecipe,
  deleteRecipe,
};

