import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiEndpoints = createRequire(import.meta.url)(
  '../../src/background/financialStatement/apiEndpoints.json',
) as typeof import('../../src/background/financialStatement/apiEndpoints.json');

const repo = resolve(import.meta.dirname, '../..');
const source = process.env.POPUP_PREVIEW_SOURCE
  ? resolve(process.env.POPUP_PREVIEW_SOURCE)
  : resolve(repo, 'src');
const endpoint = new URL(apiEndpoints.development);

export default defineConfig({
  root: import.meta.dirname,
  // 比較用サーバを同時に起動しても、別ソースの依存最適化キャッシュを上書きしない。
  cacheDir: resolve(
    repo,
    'node_modules/.vite-popup-preview',
    createHash('sha256').update(source).digest('hex').slice(0, 12),
  ),
  publicDir: resolve(repo, 'public'),
  define: { ANALYTICS_ENABLED: 'false', EXTENSION_VERSION: '"preview"' },
  resolve: {
    alias: { '@': source },
    dedupe: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
  },
  server: {
    host: '127.0.0.1',
    port: 8302,
    strictPort: true,
    fs: { allow: [repo, resolve(source, '..')] },
    proxy: {
      '/graphql': { target: endpoint.origin, changeOrigin: true, rewrite: () => endpoint.pathname },
    },
  },
  plugins: [
    react(),
    {
      name: 'popup-preview',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url?.split('?')[0] !== '/popup.html') {
            next();
            return;
          }
          // 窓の寸法も本体のHTMLを使い、確認用ページだけ違うレイアウトになることを防ぐ。
          const html = readFileSync(resolve(source, 'popup/popup.html'), 'utf8').replace(
            './index.tsx',
            '/popup.tsx',
          );
          void server
            .transformIndexHtml('/popup.html', html)
            .then((transformed) => {
              response.setHeader('Content-Type', 'text/html; charset=utf-8');
              response.end(transformed);
            })
            .catch(next);
        });
      },
    },
  ],
});
