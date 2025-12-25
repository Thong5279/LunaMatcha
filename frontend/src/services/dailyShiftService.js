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
        timeout: 15000,
        validateStatus: (status) => status === 200 || status === 201
      });
      return response;
    } catch (error) {
      // Nếu lỗi nhưng response là HTML, trả về để frontend xử lý
      if (error.response && error.response.headers['content-type']?.includes('text/html')) {
        return {
          data: new Blob([error.response.data], { type: 'text/html; charset=utf-8' }),
          headers: error.response.headers
        };
      }
      // Nếu response là string (HTML), convert sang blob
      if (error.response && typeof error.response.data === 'string') {
        return {
          data: new Blob([error.response.data], { type: 'text/html; charset=utf-8' }),
          headers: error.response.headers
        };
      }
      throw error;
    }
  },
};



