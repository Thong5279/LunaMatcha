import api from './api';

export const recipeService = {
  // Lấy công thức của sản phẩm (chứa cả ingredientsSmall và ingredientsLarge)
  getByProductId: (productId) => api.get(`/api/recipes/products/${productId}`),
  
  // Lấy công thức theo nhiều productId
  getByProductIds: (productIds) => {
    const ids = Array.isArray(productIds) ? productIds.join(',') : productIds;
    return api.get(`/api/recipes/bulk?productIds=${ids}`);
  },
  
  // Tạo hoặc cập nhật công thức (nhận ingredientsSmall và ingredientsLarge)
  createOrUpdate: (productId, recipeData) => 
    api.post(`/api/recipes/products/${productId}`, recipeData),
  
  // Xóa công thức
  delete: (recipeId) => api.delete(`/api/recipes/${recipeId}`),
};

