import api from './api';

export const recipeService = {
  // Lấy công thức theo productId
  getByProductId: (productId) => api.get(`/api/recipes/products/${productId}`),
  
  // Lấy công thức theo nhiều productId
  getByProductIds: (productIds) => {
    const ids = Array.isArray(productIds) ? productIds.join(',') : productIds;
    return api.get(`/api/recipes/bulk?productIds=${ids}`);
  },
  
  // Tạo hoặc cập nhật công thức
  createOrUpdate: (productId, recipeData) => 
    api.post(`/api/recipes/products/${productId}`, recipeData),
  
  // Xóa công thức
  delete: (recipeId) => api.delete(`/api/recipes/${recipeId}`),
};

