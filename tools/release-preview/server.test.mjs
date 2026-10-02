import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPreviewServer } from './server.mjs';

async function buildFixture(t, changes = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'investee-release-preview-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const manifest = {
    name: 'investee',
    version: '1.5.2',
    manifest_version: 3,
    host_permissions: ['https://investee.info/*'],
    background: { service_worker: 'service-worker-loader.js' },
    action: { default_popup: 'popup/popup.html' },
    ...changes,
  };
  await mkdir(join(dir, 'popup'));
  await mkdir(join(dir, 'assets'));
  await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest));
  await writeFile(
    join(dir, 'popup/popup.html'),
    '<script type="module" crossorigin src="/assets/popup.js"></script>',
  );
  await writeFile(join(dir, 'assets/popup.js'), '/* exact production bytes */');
  await writeFile(join(dir, '.env'), 'test-only-sentinel');
  return dir;
}

async function running(t, buildDir) {
  const server = await createPreviewServer({ buildDir });
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  assert.equal(server.address().address, '127.0.0.1');
  return `http://127.0.0.1:${server.address().port}`;
}

test('uses unchanged built assets and a local popup bridge', async (t) => {
  const url = await running(t, await buildFixture(t));
  assert.equal(
    await (await fetch(`${url}/assets/popup.js`)).text(),
    '/* exact production bytes */',
  );
  const popup = await (await fetch(`${url}/popup/popup.html`)).text();
  assert.match(popup, /src="\/popup-bridge.js" data-popup="\/assets\/popup.js"/);
  assert.match(await (await fetch(url)).text(), /investee 1\.5\.2/);
  const fixtures = await (await fetch(`${url}/fixtures.json`)).json();
  assert.equal(fixtures.length, 10);
  assert.equal(
    fixtures.find((s) => s.id === 'normal').reports[0].companyName,
    '表示確認用・黒字株式会社',
  );
});

test('serves only preview/build assets and blocks external connections', async (t) => {
  const url = await running(t, await buildFixture(t));
  for (const path of [
    '/.env',
    '/manifest.json',
    '/server.mjs',
    '/assets/%2e%2e%2f.env',
    '/missing.js',
  ]) {
    assert.equal((await fetch(url + path)).status, 404, path);
  }
  const response = await fetch(url);
  assert.match(response.headers.get('content-security-policy'), /connect-src 'self'/);
  assert.match(response.headers.get('content-security-policy'), /object-src 'none'/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await fetch(url, { method: 'POST' })).status, 405);
});

test('does not follow a built asset symlink outside the build directory', async (t) => {
  const dir = await buildFixture(t);
  const outside = await mkdtemp(join(tmpdir(), 'investee-preview-outside-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(join(outside, 'outside.js'), 'test-only-outside-sentinel');
  await symlink(join(outside, 'outside.js'), join(dir, 'assets/leak.js'));
  const url = await running(t, dir);
  assert.equal((await fetch(`${url}/assets/leak.js`)).status, 404);
});

test('rejects development, wrong permissions, and missing popup entries', async (t) => {
  for (const changes of [
    { name: '[Dev] investee' },
    { host_permissions: ['http://localhost/*'] },
    { manifest_version: 2 },
    { background: { service_worker: 'other.js' } },
  ]) {
    await assert.rejects(
      createPreviewServer({ buildDir: await buildFixture(t, changes) }),
      /本番Manifest/,
    );
  }
  const dir = await buildFixture(t);
  await writeFile(join(dir, 'popup/popup.html'), '<p>missing entry</p>');
  await assert.rejects(createPreviewServer({ buildDir: dir }), /エントリー/);
});
