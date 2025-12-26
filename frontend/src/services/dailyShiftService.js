import api from './api';

export const dailyShiftService = {
  getOrCreate: (date) => api.get('/api/shifts', { params: { date } }),
  getList: (params) => api.get('/api/shifts/list', { params }),
  updateStartAmount: (id, startAmount) => api.put(`/api/shifts/${id}/start-amount`, { startAmount }),
  print: async (id) => {
    try {
      // Nhận binary data (ESC/POS) từ backend
      const response = await api.post(`/api/shifts/${id}/print`, {}, { 
        responseType: 'blob',
        timeout: 15000,
        validateStatus: (status) => status === 200 || status === 201
      });
      return response;
    } catch (error) {
      // Nếu lỗi nhưng response là blob, vẫn trả về
      if (error.response && error.response.data instanceof Blob) {
        return {
          data: error.response.data,
          headers: error.response.headers
        };
      }
      throw error;
    }
  },
};



