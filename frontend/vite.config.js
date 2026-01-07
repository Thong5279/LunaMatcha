import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Loại bỏ manual chunks - để Vite tự động optimize
        // Vite sẽ tự động đảm bảo React được bundle đúng cách và không có conflict
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
