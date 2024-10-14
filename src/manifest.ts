import { defineManifest } from '@crxjs/vite-plugin';
import { version } from '../package.json';

// NOTE: do not include src/ in paths,
// vite root folder: src, public folder: public (based on the project root)
// @see ../vite.config.ts#L16

const manifest = defineManifest(async (env) => ({
  manifest_version: 3,
  name: `${env.mode === 'development' ? '[Dev] ' : ''}investee | 投資のための企業分析をしよう！`,
  description: '上場企業の最新の財務三表を可視化します！株式の投資先選定に役立つ情報が満載です！',
  version,
  // ブラウザイベントの監視
  background: {
    service_worker: 'background/index.ts',
  },
  // 表示中のページ情報取得・表示中のページに対にする処理
  content_scripts: [],
  // 拡張機能右クリック時のオプションに関する表示
  // options_ui: {},
  // CORSエラー回避のためにこの拡張機能からアクセス可能なホスト
  host_permissions: ['https://investee.info/'],
  web_accessible_resources: [],
  // 画面上でこの拡張機能が持つ機能
  action: {
    default_popup: 'popup/popup.html',
    default_icon: {
      '16': 'images/extension_16.png',
      '32': 'images/extension_32.png',
      '48': 'images/extension_48.png',
      '128': 'images/extension_128.png',
    },
  },
  icons: {
    '16': 'images/extension_16.png',
    '32': 'images/extension_32.png',
    '48': 'images/extension_48.png',
    '128': 'images/extension_128.png',
  },
  // この拡張機能が使えるリソース
  permissions: ['storage', 'tabs'],
}));

export default manifest;
