import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005',
  timeout: 60000, // 60 giây timeout (đủ cho server wake up)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry interceptor với exponential backoff
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Chỉ retry cho timeout hoặc network error
    const shouldRetry = 
      (error.code === 'ECONNABORTED' || // Timeout
       error.message === 'Network Error' || // Network error
       !error.response) && // No response (server có thể đang wake up)
      !config._retry && // Chưa retry
      (config._retryCount || 0) < 3; // Tối đa 3 lần retry
    
    if (shouldRetry) {
      config._retry = true;
      config._retryCount = (config._retryCount || 0) + 1;
      
      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.pow(2, config._retryCount) * 1000;
      
      console.log(`API retry ${config._retryCount}/3 after ${delay}ms for ${config.url}`);
      
      // Đợi trước khi retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry request
      return api(config);
    }
    
    // Nếu không retry được, trả về error
    return Promise.reject(error);
  }
);

export default api;




