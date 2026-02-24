import api from './api';

export const analyticsService = {
  getDaily: (date) => api.get('/api/analytics/daily', { params: { date } }),
  getWeekly: (week) => api.get('/api/analytics/weekly', { params: { week } }),
  getMonthly: (month, params = {}) => api.get('/api/analytics/monthly', { params: { month, ...params } }),
  getQuarterly: (quarter, params = {}) => api.get('/api/analytics/quarterly', { params: { quarter, ...params } }),
  getYearly: (year, params = {}) => api.get('/api/analytics/yearly', { params: { year, ...params } }),
  // Peak hours (multi-period)
  getPeakHoursDaily: (date) => api.get('/api/analytics/peak-hours', { params: { date } }),
  getPeakHoursWeekly: (week) => api.get('/api/analytics/peak-hours/weekly', { params: { week } }),
  getPeakHoursMonthly: (month) => api.get('/api/analytics/peak-hours/monthly', { params: { month } }),
  getPeakHoursQuarterly: (quarter) => api.get('/api/analytics/peak-hours/quarterly', { params: { quarter } }),
  getPeakHoursYearly: (year) => api.get('/api/analytics/peak-hours/yearly', { params: { year } }),
  getTopProducts: (params) => api.get('/api/analytics/products', { params }),
};






