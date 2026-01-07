import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - NHƯNG KHÔNG SPLIT REACT
          if (id.includes('node_modules')) {
            // KHÔNG split React - để React luôn trong entry chunk
            // React hooks yêu cầu cùng một instance của React
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return undefined; // Không split, giữ trong entry chunk
            }
            // Chart library
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            // UI libraries
            if (id.includes('react-icons') || id.includes('react-hot-toast')) {
              return 'ui-vendor';
            }
            // Axios
            if (id.includes('axios')) {
              return 'axios-vendor';
            }
            // Other node_modules
            return 'vendor';
          }
          
          // Component chunks (lazy loaded)
          if (id.includes('/components/SellMode') || id.includes('/components/ProductForm') || 
              id.includes('/components/ToppingManager') || id.includes('/components/CelebrationModal')) {
            return 'home-components';
          }
          
          if (id.includes('/pages/Orders')) {
            return 'orders-page';
          }
          
          if (id.includes('/pages/Analytics')) {
            return 'analytics-page';
          }
          
          if (id.includes('/pages/DailyShift')) {
            return 'shift-page';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild', // Use esbuild for faster builds
    // Enable tree-shaking - nhưng đảm bảo React có side effects
    treeshake: {
      moduleSideEffects: (id) => {
        // Đảm bảo React có side effects để bundle đúng
        if (id.includes('react') || id.includes('react-dom')) {
          return true;
        }
        return false;
      },
    },
    // Source maps for production (optional, có thể tắt để giảm size)
    sourcemap: false,
    // Reduce bundle size
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets < 4kb
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    // Exclude large dependencies from pre-bundling
    exclude: ['recharts'],
    // Force re-optimize để đảm bảo React được bundle đúng
    force: true,
  },
  // Improve build performance
  esbuild: {
    // Drop console and debugger in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
