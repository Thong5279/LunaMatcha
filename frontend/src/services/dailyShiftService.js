import api from './api';

export const dailyShiftService = {
  getOrCreate: (date) => api.get('/api/shifts', { params: { date } }),
  getList: (params) => api.get('/api/shifts/list', { params }),
  updateStartAmount: (id, startAmount) => api.put(`/api/shifts/${id}/start-amount`, { startAmount }),
};

