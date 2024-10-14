import 'webextension-polyfill';
import 'construct-style-sheets-polyfill';
import { proxyStore } from '../app/proxyStore';

proxyStore.ready().then(() => {
  // 表示中のページ情報取得・表示中のページに対にする処理を行う
  // manifest.tsでcontent_scriptsを設定する際に使用する
});
