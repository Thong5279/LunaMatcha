import api from './api';

export const productService = {
  getAll: () => api.get('/api/products'),
  create: (formData) => api.post('/api/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/api/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/api/products/${id}`),
};

