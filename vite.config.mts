import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import manifest from './src/manifest.mts';

export default defineConfig((config) => {
  const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

  return {
    define: {
      ANALYTICS_ENABLED: JSON.stringify(config.mode === 'production'),
      EXTENSION_VERSION: JSON.stringify(version),
    },
    // @see https://github.com/crxjs/chrome-extension-tools/issues/696
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
      // https://github.com/vitejs/vite/discussions/3396#discussioncomment-10371388
      // vite --hostで起動する
      host: true,
    },
    // prevent src/ prefix on extension urls
    root: resolve(import.meta.dirname, 'src'),
    publicDir: resolve(import.meta.dirname, 'public'),
    build: {
      outDir: resolve(import.meta.dirname, 'dist'),
      // root が src のため outDir がプロジェクトルート外扱いになり、明示しないと毎回警告が出る
      emptyOutDir: true,
      rolldownOptions: {
        output: {
          chunkFileNames: 'assets/chunk-[hash].js',
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, 'src'),
      },
    },
    plugins: [react(), crx({ manifest })],
  };
});
