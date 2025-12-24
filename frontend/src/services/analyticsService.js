import api from './api';

export const analyticsService = {
  getDaily: (date) => api.get('/api/analytics/daily', { params: { date } }),
  getWeekly: (week) => api.get('/api/analytics/weekly', { params: { week } }),
  getMonthly: (month) => api.get('/api/analytics/monthly', { params: { month } }),
  getQuarterly: (quarter) => api.get('/api/analytics/quarterly', { params: { quarter } }),
  getYearly: (year) => api.get('/api/analytics/yearly', { params: { year } }),
  getPeakHours: (date) => api.get('/api/analytics/peak-hours', { params: { date } }),
  getTopProducts: (params) => api.get('/api/analytics/products', { params }),
};


