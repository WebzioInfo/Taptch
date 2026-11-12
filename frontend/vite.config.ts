import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// If running inside a symlink or junction directory (e.g. D:\Webzio\taptch -> D:\Webzio\tappzio),
// synchronize process.cwd() with the canonical realpath so Vite and esbuild optimizer match paths.
try {
  const realCwd = fs.realpathSync(process.cwd());
  if (realCwd !== process.cwd()) {
    process.chdir(realCwd);
  }
} catch {
  // Ignore fallback
}

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
