import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@taptch/shared': path.resolve(__dirname, '../shared/src'),
      'next/link': path.resolve(__dirname, './src/compat/link.tsx'),
      'next/image': path.resolve(__dirname, './src/compat/image.tsx'),
      'next/navigation': path.resolve(__dirname, './src/compat/navigation.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/dq': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
