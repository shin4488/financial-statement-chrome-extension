// @vitest-environment node
import viteConfig from '../vite.config.mts';
import manifest from './manifest.mts';

const env = { command: 'build', mode: 'production' } as const;

it('builds for the same minimum Chrome version that the production manifest declares', async () => {
  if (typeof manifest !== 'function') {
    throw new Error('manifest.mts must export a manifest function');
  }
  const { minimum_chrome_version } = await manifest(env);
  const { build } = await viteConfig(env);

  // 申告がないと、動かない古い Chrome にもストアから更新が届く
  expect(minimum_chrome_version).toMatch(/^\d+$/);
  // 出力するコードが申告より新しい Chrome を前提にしないよう、target は申告と同じ版にする
  expect(build?.target).toBe(`chrome${minimum_chrome_version}`);
});
