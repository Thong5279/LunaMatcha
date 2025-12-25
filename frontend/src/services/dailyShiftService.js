import api from './api';

export const dailyShiftService = {
  getOrCreate: (date) => api.get('/api/shifts', { params: { date } }),
  getList: (params) => api.get('/api/shifts/list', { params }),
  updateStartAmount: (id, startAmount) => api.put(`/api/shifts/${id}/start-amount`, { startAmount }),
  print: async (id) => {
    try {
      // Thử nhận JSON trước (nếu in thành công)
      const response = await api.post(`/api/shifts/${id}/print`, {}, { 
        responseType: 'json',
        timeout: 10000 
      });
      return response;
    } catch (error) {
      // Nếu lỗi và response là HTML, trả về blob
      if (error.response && error.response.headers['content-type']?.includes('text/html')) {
        return {
          data: new Blob([error.response.data], { type: 'text/html; charset=utf-8' })
        };
      }
      throw error;
    }
  },
};



