import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
  },

  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,

    proxy: {
      '/api/system/status': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },

      '/api/auth': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },

      '/api/user': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },

      '/api/bee2-demo': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },

      '^/api/stocks/[^/]+$': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },

      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          plotly: ['plotly.js-dist-min', 'react-plotly.js'],
          recharts: ['recharts'],
          icons: ['lucide-react'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  },
});