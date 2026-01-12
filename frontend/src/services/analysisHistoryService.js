import api from './api';

export const analysisHistoryService = {
  create: (data) => api.post('/api/analysis-history', data),
  getAll: (params) => api.get('/api/analysis-history', { params }),
  getById: (id) => api.get(`/api/analysis-history/${id}`),
  delete: (id) => api.delete(`/api/analysis-history/${id}`),
};

