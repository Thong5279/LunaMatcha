import axios from 'axios';
import { getCache, setCache, isCacheStale, clearCachePattern } from '../utils/cacheManager';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005',
  timeout: 15000, // 15 giây timeout (đủ cho server wake up + query, fail nhanh hơn)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Đơn giản hóa cache (loại bỏ stale-while-revalidate)
api.interceptors.request.use(
  async (config) => {
    // Chỉ cache GET requests
    if (config.method === 'get' && !config._skipCache) {
      const url = config.url;
      const params = config.params || {};
      
      // Kiểm tra cache - đơn giản
      const cachedData = getCache(url, params);
      
      if (cachedData && !isCacheStale(url, params)) {
        // Có cache và chưa stale, trả về ngay
        config._fromCache = true;
        config._cachedData = cachedData;
      }
      // Không fetch background - đơn giản hơn, tránh race condition
    }
    
    // Clear cache khi có mutations
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      const url = config.url;
      
      // Clear cache liên quan
      if (url.includes('/products')) {
        clearCachePattern('/products');
      } else if (url.includes('/toppings')) {
        clearCachePattern('/toppings');
      } else if (url.includes('/recipes')) {
        clearCachePattern('/recipes');
      } else if (url.includes('/orders')) {
        clearCachePattern('/orders');
      } else if (url.includes('/shifts')) {
        clearCachePattern('/shifts');
      } else if (url.includes('/analytics')) {
        clearCachePattern('/analytics');
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Cache responses và retry logic
api.interceptors.response.use(
  (response) => {
    const config = response.config;
    
    // Nếu có cached data trong request (stale-while-revalidate), vẫn cache fresh data
    if (config._fromCache && config._cachedData) {
      // Fresh data đã về, cache lại cho lần sau
      const url = config.url;
      const params = config.params || {};
      setCache(url, response.data, params);
      // Trả về fresh data (không phải cached data)
      return response;
    }
    
    // Cache GET responses (trừ background fetch đã cache ở fetchFreshData)
    if (config.method === 'get' && !config._skipCache && !config._backgroundFetch) {
      const url = config.url;
      const params = config.params || {};
      setCache(url, response.data, params);
    }
    
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // Nếu có cached data và request failed, trả về cached data
    if (config && config._fromCache && config._cachedData) {
      console.warn('Request failed, using cached data:', config.url);
      // Tạo response object từ cached data
      return Promise.resolve({
        data: config._cachedData,
        status: 200,
        statusText: 'OK (from cache)',
        headers: {},
        config,
        _fromCache: true,
      });
    }
    
    // Retry logic đơn giản hóa - chỉ retry 1 lần với fixed delay
    const shouldRetry = 
      (!error.response) && // Chỉ retry khi không có response (server wake up)
      !config._retry && // Chưa retry
      !config._backgroundFetch && // Không retry background fetch
      (config._retryCount || 0) < 1; // Chỉ retry 1 lần
    
    if (shouldRetry) {
      config._retry = true;
      config._retryCount = (config._retryCount || 0) + 1;
      
      // Fixed delay 2 giây thay vì exponential backoff
      const delay = 2000;
      
      console.log(`API retry ${config._retryCount}/1 after ${delay}ms for ${config.url}`);
      
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




