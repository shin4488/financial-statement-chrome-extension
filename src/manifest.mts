import { defineManifest } from '@crxjs/vite-plugin';
import { readFileSync } from 'node:fs';

// バージョンはpackage.jsonから取る。JSONのimportはVite次期の設定ローダで属性(with { type: 'json' })が必須になり、
// このリポジトリのprettier 2がその構文を扱えないため、ファイルを読んで取り出す
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

// NOTE: do not include src/ in paths,
// vite root folder: src, public folder: public (based on the project root)
// @see ../vite.config.mts

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
  // （本番APIはCORSヘッダを返さないため、拡張からのfetchはhost_permissionsのCORS免除が頼り。
  //   パスまで含めた '/*' でないと /api/graphql がマッチしない）
  // 開発ビルドはローカルdockerのバックエンド（financial-statementリポジトリ）も許可する
  host_permissions:
    env.mode === 'development'
      ? ['https://investee.info/*', 'http://localhost:20000/*']
      : ['https://investee.info/*'],
  web_accessible_resources: [],
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
  permissions: ['storage', 'tabs'],
}));

export default manifest;
