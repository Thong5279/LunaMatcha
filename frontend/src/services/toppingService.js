import api from './api';

export const toppingService = {
  getAll: () => api.get('/api/toppings'),
  create: (data) => api.post('/api/toppings', data),
  update: (id, data) => api.put(`/api/toppings/${id}`, data),
  delete: (id) => api.delete(`/api/toppings/${id}`),
};


