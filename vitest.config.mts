import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  test: {
    // src/shared/ のテストはコピー元と共通で、グローバルの describe / it / expect を使う
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tools/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['src/setupTests.ts'],
  },
});
