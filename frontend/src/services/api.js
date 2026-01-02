import axios from 'axios';
import { getCache, setCache, isCacheStale, clearCachePattern } from '../utils/cacheManager';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5005',
  timeout: 60000, // 60 giây timeout (đủ cho server wake up)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Implement stale-while-revalidate caching
api.interceptors.request.use(
  async (config) => {
    // Chỉ cache GET requests
    if (config.method === 'get' && !config._skipCache) {
      const url = config.url;
      const params = config.params || {};
      
      // Kiểm tra cache
      const cachedData = getCache(url, params);
      
      if (cachedData) {
        // Có cache, đánh dấu để response interceptor trả về cached data ngay
        config._fromCache = true;
        config._cachedData = cachedData;
        
        // Nếu cache đã stale, fetch fresh data ở background
        if (isCacheStale(url, params)) {
          // Fetch fresh data ở background (không block)
          fetchFreshData(url, params, config).catch(err => {
            console.warn('Background fetch failed:', err);
          });
        }
      }
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

// Helper function để fetch fresh data ở background
const fetchFreshData = async (url, params, originalConfig) => {
  try {
    // Tạo config mới cho background fetch
    const bgConfig = {
      ...originalConfig,
      _skipCache: true, // Không cache lần này (sẽ cache ở response interceptor)
      _backgroundFetch: true, // Đánh dấu là background fetch
    };
    
    const response = await axios(bgConfig);
    
    // Cache fresh data
    setCache(url, response.data, params);
    
    return response;
  } catch (error) {
    // Background fetch failed, giữ nguyên cache
    return null;
  }
};

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
    
    // Retry logic với exponential backoff
    const shouldRetry = 
      (error.code === 'ECONNABORTED' || // Timeout
       error.message === 'Network Error' || // Network error
       !error.response) && // No response (server có thể đang wake up)
      !config._retry && // Chưa retry
      !config._backgroundFetch && // Không retry background fetch
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




