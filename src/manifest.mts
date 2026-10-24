import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from '../package.json' with { type: 'json' };

const { version } = packageJson;

// 配布物が動く最も古い Chrome。ビルドの target にも使い、出力するコードと申告する版を一致させる。
// 依存が対応するブラウザの下限のうち、最も新しいものに合わせる
export const minimumChromeVersion = 111;

// NOTE: do not include src/ in paths,
// vite root folder: src, public folder: public (based on the project root)
// @see ../vite.config.mts

const manifest = defineManifest(async (env) => ({
  manifest_version: 3,
  name: `${env.mode === 'development' ? '[Dev] ' : ''}investee | 投資のための企業分析をしよう！`,
  description: '上場企業の最新の財務三表を可視化します！株式の投資先選定に役立つ情報が満載です！',
  version,
  // これより古い Chrome にはストアから新規インストール・更新させない（動かない版へ自動更新させない）
  minimum_chrome_version: String(minimumChromeVersion),
  // ブラウザイベントの監視
  background: {
    service_worker: 'background/index.ts',
  },
  // 表示中のページ情報取得・表示中のページに対する処理
  content_scripts: [],
  // 本番APIはCORSヘッダを返さないため、拡張からのfetchはhost_permissionsによるCORSの免除で通す。
  // パスまで含めた '/*' でないと /api/graphql がマッチしない。
  // 開発ビルドはローカルdockerのバックエンド（financial-statementリポジトリ）も許可する
  host_permissions:
    env.mode === 'development'
      ? ['https://investee.info/*', 'http://localhost:20000/*']
      : ['https://investee.info/*'],
  // 画面上でこの拡張機能が持つ機能
  action: {
    default_popup: 'popup/popup.html',
    default_icon: {
      '16': 'images/logo16.png',
      '32': 'images/logo32.png',
      '48': 'images/logo48.png',
      '128': 'images/logo128.png',
    },
  },
  icons: {
    '16': 'images/logo16.png',
    '32': 'images/logo32.png',
    '48': 'images/logo48.png',
    '128': 'images/logo128.png',
  },
  // この拡張機能が使えるリソース
  // storage: service worker が停止しても表示中のページの状態を残すため（storage.session）
  // tabs: 対応サイトのタブの URL から銘柄ページかを判定するため（host_permissions にないサイトの URL は、tabs がないと読めない）
  permissions: ['storage', 'tabs'],
}));

export default manifest;
