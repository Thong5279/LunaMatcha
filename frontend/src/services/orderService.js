import api from './api';

export const orderService = {
  getAll: (params) => api.get('/api/orders', { params }),
  getById: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post('/api/orders', data),
  update: (id, data) => api.put(`/api/orders/${id}`, data),
  delete: (id) => api.delete(`/api/orders/${id}`),
  hold: (id) => api.post(`/api/orders/${id}/hold`),
  getHeld: () => api.get('/api/orders/held'),
  restore: (id) => api.post(`/api/orders/${id}/restore`),
};



