const scenarios = await (await fetch('/fixtures.json')).json();
const select = document.getElementById('scenario');
for (const scenario of scenarios) {
  const option = document.createElement('option');
  option.value = scenario.id;
  option.textContent = scenario.name;
  select.append(option);
}
select.addEventListener(
  'change',
  () =>
    (document.getElementById('popup').src =
      '/popup/popup.html?case=' + encodeURIComponent(select.value)),
);
document.getElementById('start').addEventListener('click', async () => {
  const button = document.getElementById('start');
  button.disabled = true;
  const result = document.getElementById('result');
  result.textContent = '実行中…';
  const worker = new Worker('/worker-bridge.js', { type: 'module' }),
    pending = new Map();
  let next = 0,
    passed = 0;
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Worker initialization timed out')), 10000);
    worker.addEventListener('message', (event) => {
      if (event.data.ready) {
        clearTimeout(timer);
        resolve();
      } else {
        const promise = pending.get(event.data.id);
        if (promise) {
          pending.delete(event.data.id);
          if (event.data.error) {
            promise.reject(Error(event.data.error));
          } else {
            promise.resolve(event.data.value);
          }
        }
      }
    });
    worker.addEventListener('error', (event) => {
      clearTimeout(timer);
      reject(Error(event.message));
    });
  });
  const rpc = (command, options = {}) =>
    new Promise((resolve, reject) => {
      const id = ++next;
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, command, ...options });
      setTimeout(() => {
        if (pending.delete(id)) {
          reject(Error('Test timed out'));
        }
      }, 10000);
    });
  const check = (name, condition) => {
    if (!condition) {
      throw Error(name);
    }
    passed++;
    result.textContent += '\nPASS ' + name;
  };
  try {
    await ready;
    result.textContent = '';
    let value = await rpc('snapshot');
    check(
      '旧キャッシュの財務・タブは復元しない',
      value.state.financialStatement.results.length === 0 && value.state.sitePage.stockCode === '',
    );
    for (const [url, code] of [
      ['https://kabutan.jp/stock/?code=7203', '7203'],
      ['https://minkabu.jp/stock/6758', '6758'],
      ['https://finance.yahoo.co.jp/quote/391A.T', '391A'],
      ['https://shikiho.toyokeizai.net/stocks/2168', '2168'],
      ['https://www.buffett-code.com/company/9984', '9984'],
      ['https://www.rakuten-sec.co.jp/web/market/search/quote.html?ric=130A.T', '130A'],
      ['https://member.rakuten-sec.co.jp/app/info_jp_prc_stock.do?dscrCd=30640', '3064'],
    ]) {
      value = await rpc('tab', { url });
      check(
        '銘柄検出・API変数 ' + new URL(url).hostname,
        value.enabled &&
          value.state.sitePage.stockCode === code &&
          value.state.financialStatement.status === 'success' &&
          value.requests.at(-1).variables.stockCodes[0] === code,
      );
    }
    check(
      '本番GraphQL接続先・クエリ・変数',
      value.requests.every(
        (r) =>
          r.url === 'https://investee.info/api/graphql' &&
          r.query.includes('financialReports') &&
          r.variables.stockCodes.length === 1,
      ),
    );
    const before = value.requests.length;
    value = await rpc('repeat');
    check('同じページの更新で再取得しない', value.requests.length === before);
    value = await rpc('tab', { url: 'https://kabutan.jp/stock/?code=1001', outcome: 'empty' });
    check(
      '取得0件をemptyとして扱う',
      value.state.financialStatement.status === 'empty' &&
        value.state.financialStatement.results.length === 0,
    );
    value = await rpc('tab', {
      url: 'https://kabutan.jp/stock/?code=1002',
      outcome: 'graphql-error',
    });
    check('GraphQL失敗をerrorとして扱う', value.state.financialStatement.status === 'error');
    value = await rpc('tab', {
      url: 'https://kabutan.jp/stock/?code=1003',
      outcome: 'network-error',
    });
    check('通信失敗をerrorとして扱う', value.state.financialStatement.status === 'error');
    value = await rpc('tab', { url: 'https://kabutan.jp/stock/?code=1003', outcome: 'normal' });
    check('同じ銘柄で失敗後に再試行できる', value.state.financialStatement.status === 'success');
    const slow = rpc('tab', {
      url: 'https://kabutan.jp/stock/?code=1004',
      outcome: 'normal',
      hold: true,
    });
    value = await rpc('snapshot');
    if (value.requests.at(-1).variables.stockCodes[0] !== '1004') {
      throw Error('旧銘柄の応答待ちを開始できませんでした');
    }
    value = await rpc('tab', { url: 'https://kabutan.jp/stock/?code=1005', outcome: 'loss' });
    await rpc('release');
    await slow;
    value = await rpc('snapshot');
    check(
      '遅い旧銘柄の応答が新銘柄を上書きしない',
      value.state.sitePage.stockCode === '1005' &&
        value.state.financialStatement.results[0].id ===
          scenarios.find((s) => s.id === 'loss').reports[0].id,
    );
    value = await rpc('tab', { url: 'https://example.invalid/' });
    check(
      '対応外ページで無効化して古いデータを消す',
      !value.enabled &&
        value.state.financialStatement.status === 'idle' &&
        value.state.financialStatement.results.length === 0,
    );
    value = await rpc('tab', { url: 'https://finance.yahoo.co.jp/quote/998407.O' });
    check('指数ページを銘柄と誤認しない', !value.enabled && value.state.sitePage.stockCode === '');
    value = await rpc('tab', { url: 'https://kabutan.jp/news/?code=7203' });
    check(
      'ニュースページを銘柄と誤認しない',
      !value.enabled && value.state.sitePage.stockCode === '',
    );
    value = await rpc('tab', { url: 'https://constructor/stock/?code=7203' });
    check(
      'プロトタイプ名を対応ドメインと誤認しない',
      !value.enabled && value.state.sitePage.stockCode === '',
    );
    check('保存済みの自動切替設定を維持する', value.state.autoPlayStatus.isAutoPlay === false);
    result.textContent +=
      '\n\n' + passed + '件成功 / 0件失敗\n外部API呼び出し 0件（ローカル応答のみ）';
  } catch (error) {
    result.textContent += '\nFAIL ' + error.message;
  } finally {
    worker.terminate();
    button.disabled = false;
  }
});
