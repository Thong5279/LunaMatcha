const express = require('express');
const router = express.Router();
const {
  getRecipe,
  getRecipesByProductIds,
  createOrUpdateRecipe,
  deleteRecipe,
} = require('../controllers/recipeController');

// GET /api/recipes/products/:productId - Lấy công thức của sản phẩm
router.get('/products/:productId', getRecipe);

// GET /api/recipes/bulk?productIds=id1,id2,id3 - Lấy công thức theo nhiều productId
router.get('/bulk', getRecipesByProductIds);

// POST /api/recipes/products/:productId - Tạo/cập nhật công thức
router.post('/products/:productId', createOrUpdateRecipe);

// DELETE /api/recipes/:id - Xóa công thức
router.delete('/:id', deleteRecipe);

module.exports = router;

