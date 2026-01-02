import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { productService } from './services/productService'
import { getCache, isCacheStale } from './utils/cacheManager'

// Prefetch critical data (products) khi app khởi động
const prefetchCriticalData = () => {
  // Chỉ prefetch nếu chưa có cache hoặc cache đã stale
  const cacheKey = '/api/products';
  const cachedData = getCache(cacheKey);
  const stale = isCacheStale(cacheKey);
  
  if (!cachedData || stale) {
    // Prefetch products data ở background
    // Sử dụng requestIdleCallback nếu có, fallback to setTimeout
    const prefetch = () => {
      productService.getAll()
        .then(() => {
          console.log('[Prefetch] Products data prefetched');
        })
        .catch((error) => {
          console.warn('[Prefetch] Failed to prefetch products:', error);
        });
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      // Fallback cho browsers không support requestIdleCallback
      setTimeout(prefetch, 1000);
    }
  }
};

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, prompt user to reload
                console.log('New service worker available. Reload to update.');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    
    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Service worker updated, reload page
      window.location.reload();
    });
  });
}

// Prefetch critical data sau khi DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', prefetchCriticalData);
} else {
  // DOM đã ready
  prefetchCriticalData();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
