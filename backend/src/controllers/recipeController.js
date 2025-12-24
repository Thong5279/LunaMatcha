const Recipe = require('../models/Recipe');

// Lấy công thức theo productId
const getRecipe = async (req, res) => {
  try {
    const { productId } = req.params;
    const recipe = await Recipe.findOne({ productId }).populate('productId');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Không tìm thấy công thức' });
    }
    
    res.json(recipe);
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
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một nguyên liệu' });
    }
    
    // Validate ingredients
    for (const ingredient of ingredients) {
      if (!ingredient.name || !ingredient.amount || !ingredient.unit) {
        return res.status(400).json({ message: 'Mỗi nguyên liệu phải có name, amount và unit' });
      }
      
      if (ingredient.amount <= 0) {
        return res.status(400).json({ message: 'Số lượng nguyên liệu phải lớn hơn 0' });
      }
      
      if (!['ml', 'g'].includes(ingredient.unit)) {
        return res.status(400).json({ message: 'Đơn vị chỉ được phép là ml hoặc g' });
      }
    }
    
    // Tìm công thức hiện có hoặc tạo mới
    let recipe = await Recipe.findOne({ productId });
    
    if (recipe) {
      // Cập nhật
      recipe.ingredients = ingredients;
      await recipe.save();
      res.json(recipe);
    } else {
      // Tạo mới
      recipe = new Recipe({
        productId,
        ingredients,
      });
      await recipe.save();
      res.status(201).json(recipe);
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Sản phẩm này đã có công thức' });
    }
    res.status(500).json({ message: error.message });
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
  getRecipesByProductIds,
  createOrUpdateRecipe,
  deleteRecipe,
};

