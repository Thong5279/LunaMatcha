import api from './api';

export const analyticsService = {
  getDaily: (date) => api.get('/api/analytics/daily', { params: { date } }),
  getWeekly: (week) => api.get('/api/analytics/weekly', { params: { week } }),
  getMonthly: (month, params = {}) => api.get('/api/analytics/monthly', { params: { month, ...params } }),
  getQuarterly: (quarter, params = {}) => api.get('/api/analytics/quarterly', { params: { quarter, ...params } }),
  getYearly: (year, params = {}) => api.get('/api/analytics/yearly', { params: { year, ...params } }),
  getPeakHours: (date) => api.get('/api/analytics/peak-hours', { params: { date } }),
  getTopProducts: (params) => api.get('/api/analytics/products', { params }),
};






