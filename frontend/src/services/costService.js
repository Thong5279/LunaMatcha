import api from './api';

export const costService = {
  getAll: (params) => api.get('/api/costs', { params }),
  getById: (id) => api.get(`/api/costs/${id}`),
  create: (data) => api.post('/api/costs', data),
  update: (id, data) => api.put(`/api/costs/${id}`, data),
  delete: (id) => api.delete(`/api/costs/${id}`),
  getSummary: (month, year) => api.get(`/api/costs/summary/${month}/${year}`),
};

