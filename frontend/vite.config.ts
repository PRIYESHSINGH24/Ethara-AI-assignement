import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('recharts') || id.includes('d3')) return 'charts';
            if (id.includes('lucide')) return 'icons';
            if (id.includes('date-fns')) return 'utils';
            return 'vendor';
          }
        },
      },
    },
  },
})
