import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    pool: 'threads',
    testTimeout: 30000,
    include: ['tests/**/*.test.ts'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
