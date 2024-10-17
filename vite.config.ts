import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import manifest from './src/manifest';

export default defineConfig((config) => {
  const env = loadEnv(config.mode, process.cwd());

  return {
    define: {
      VITE_GOOGLE_ANALYTICS_API_KEY: JSON.stringify(env.VITE_GOOGLE_ANALYTICS_API_KEY),
      VITE_GOOGLE_MEASUREMENT_ID: JSON.stringify(env.VITE_GOOGLE_MEASUREMENT_ID),
      VITE_GOOGLE_FIREBASE_APP_ID: JSON.stringify(env.VITE_GOOGLE_FIREBASE_APP_ID),
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
    root: resolve(__dirname, 'src'),
    publicDir: resolve(__dirname, 'public'),
    build: {
      outDir: resolve(__dirname, 'dist'),
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/chunk-[hash].js',
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    plugins: [react(), crx({ manifest })],
  };
});
