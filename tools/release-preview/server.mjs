import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const toolDir = fileURLToPath(new URL('.', import.meta.url));
const repoDir = resolve(toolDir, '../..');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};
const harnessFiles = new Set([
  'index.html',
  'popup-bridge.js',
  'worker-bridge.js',
  'background-test.js',
]);
const csp =
  "default-src 'self'; script-src 'self'; worker-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'";

async function fixedScenarios() {
  const source = await readFile(resolve(repoDir, 'tools/popup-preview/fixtures.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  runInNewContext(outputText, { exports }, { timeout: 1000 });
  return exports.scenarios;
}

function validateManifest(manifest) {
  if (
    manifest.manifest_version !== 3 ||
    /\[Dev\]/.test(manifest.name) ||
    !/^\d+\.\d+\.\d+$/.test(manifest.version) ||
    JSON.stringify(manifest.host_permissions) !== '["https://investee.info/*"]' ||
    manifest.background?.service_worker !== 'service-worker-loader.js' ||
    manifest.action?.default_popup !== 'popup/popup.html'
  ) {
    throw new Error('本番Manifest V3ビルドを指定してください');
  }
}

export async function createPreviewServer({ buildDir = resolve(repoDir, 'dist'), scenarios } = {}) {
  const buildRoot = await realpath(buildDir);
  const manifest = JSON.parse(await readFile(resolve(buildRoot, 'manifest.json'), 'utf8'));
  validateManifest(manifest);
  const fixtures = JSON.stringify(scenarios ?? (await fixedScenarios()));
  const popup = await readFile(resolve(buildRoot, 'popup/popup.html'), 'utf8');
  const entry = /<script type="module" crossorigin src="([^"]+)"><\/script>/;
  if (!entry.test(popup)) {
    throw new Error('ポップアップの本番エントリーが見つかりません');
  }
  const popupHtml = popup.replace(
    entry,
    '<script type="module" src="/popup-bridge.js" data-popup="$1"></script>',
  );

  const server = createServer(async (request, response) => {
    const send = (status, body, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, {
        'Content-Type': type,
        'Cache-Control': 'no-store',
        'Content-Security-Policy': csp,
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(body);
    };
    if (request.method !== 'GET') {
      send(405, 'Method not allowed');
      return;
    }
    try {
      const name = new URL(request.url, 'http://127.0.0.1').pathname.slice(1) || 'index.html';
      if (name === 'fixtures.json') {
        send(200, fixtures, contentTypes['.json']);
        return;
      }
      if (name === 'popup/popup.html') {
        send(200, popupHtml, contentTypes['.html']);
        return;
      }
      if (harnessFiles.has(name)) {
        const body = await readFile(resolve(toolDir, name), 'utf8');
        send(200, body.replaceAll('__VERSION__', manifest.version), contentTypes[extname(name)]);
        return;
      }
      if (
        !/^(?:assets\/[\w.-]+\.(?:js|css)|images\/[\w.-]+\.png|service-worker-loader\.js)$/.test(
          name,
        )
      ) {
        send(404, 'Not found');
        return;
      }
      const asset = await realpath(resolve(buildRoot, name));
      if (!asset.startsWith(buildRoot + sep)) {
        send(404, 'Not found');
        return;
      }
      send(200, await readFile(asset), contentTypes[extname(asset)]);
    } catch {
      send(404, 'Not found');
    }
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  if (
    args.some((arg, index) => index % 2 === 0 && !['--dir', '--port'].includes(arg)) ||
    args.length % 2
  ) {
    throw new Error('Usage: yarn preview:release [--dir dist-or-unpacked-zip] [--port 8307]');
  }
  const port = Number(option('--port') ?? 8307);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid port');
  }
  const server = await createPreviewServer({ buildDir: option('--dir') });
  server.listen(port, '127.0.0.1', () =>
    process.stdout.write(`本番ビルドのローカル確認: http://127.0.0.1:${port}\n`),
  );
  server.on('error', (error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
