/**
 * Cache Manager - Quản lý API response caching với localStorage
 * Sử dụng stale-while-revalidate pattern để cải thiện performance
 */

const CACHE_PREFIX = 'api_cache_';
const CACHE_VERSION = 'v1';

// TTL (Time To Live) cho các loại endpoint khác nhau (milliseconds)
const TTL_CONFIG = {
  products: 5 * 60 * 1000, // 5 phút
  toppings: 5 * 60 * 1000, // 5 phút
  recipes: 5 * 60 * 1000, // 5 phút
  orders: 1 * 60 * 1000, // 1 phút
  shifts: 1 * 60 * 1000, // 1 phút
  analytics: 2 * 60 * 1000, // 2 phút
  default: 1 * 60 * 1000, // 1 phút
};

/**
 * Tạo cache key từ URL và params
 */
const createCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const paramString = sortedParams ? `_${sortedParams}` : '';
  return `${CACHE_PREFIX}${CACHE_VERSION}_${url}${paramString}`;
};

/**
 * Lấy TTL cho endpoint
 */
const getTTL = (url) => {
  if (url.includes('/products')) return TTL_CONFIG.products;
  if (url.includes('/toppings')) return TTL_CONFIG.toppings;
  if (url.includes('/recipes')) return TTL_CONFIG.recipes;
  if (url.includes('/orders')) return TTL_CONFIG.orders;
  if (url.includes('/shifts')) return TTL_CONFIG.shifts;
  if (url.includes('/analytics')) return TTL_CONFIG.analytics;
  return TTL_CONFIG.default;
};

/**
 * Lưu response vào cache
 */
export const setCache = (url, data, params = {}) => {
  try {
    const key = createCacheKey(url, params);
    const ttl = getTTL(url);
    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    // localStorage có thể bị đầy hoặc không available
    console.warn('Failed to set cache:', error);
  }
};

/**
 * Lấy data từ cache
 */
export const getCache = (url, params = {}) => {
  try {
    const key = createCacheKey(url, params);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const now = Date.now();
    
    // Kiểm tra xem cache đã expire chưa
    if (now > cacheData.expiresAt) {
      // Cache đã expire, xóa và trả về null
      localStorage.removeItem(key);
      return null;
    }
    
    return cacheData.data;
  } catch (error) {
    console.warn('Failed to get cache:', error);
    return null;
  }
};

/**
 * Kiểm tra cache có stale không (vẫn còn valid nhưng đã cũ)
 */
export const isCacheStale = (url, params = {}) => {
  try {
    const key = createCacheKey(url, params);
    const cached = localStorage.getItem(key);
    
    if (!cached) return false;
    
    const cacheData = JSON.parse(cached);
    const now = Date.now();
    
    // Cache đã expire
    if (now > cacheData.expiresAt) return false;
    
    // Cache còn valid nhưng đã qua 50% TTL thì coi là stale
    const age = now - cacheData.timestamp;
    return age > cacheData.ttl * 0.5;
  } catch (error) {
    return false;
  }
};

/**
 * Xóa cache cho một endpoint
 */
export const clearCache = (url, params = {}) => {
  try {
    const key = createCacheKey(url, params);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

/**
 * Xóa tất cả cache liên quan đến một pattern (ví dụ: tất cả products)
 */
export const clearCachePattern = (pattern) => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear cache pattern:', error);
  }
};

/**
 * Xóa tất cả API cache
 */
export const clearAllCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear all cache:', error);
  }
};

/**
 * Cleanup expired cache entries
 */
export const cleanupExpiredCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleaned = 0;
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheData = JSON.parse(cached);
            if (now > cacheData.expiresAt) {
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        } catch (e) {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    });
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }
  } catch (error) {
    console.warn('Failed to cleanup expired cache:', error);
  }
};

// Cleanup expired cache khi module được load
if (typeof window !== 'undefined') {
  cleanupExpiredCache();
  // Cleanup mỗi 5 phút
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}

