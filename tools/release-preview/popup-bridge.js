const scenarios = await (await fetch('/fixtures.json')).json();
const selected =
  scenarios.find((s) => s.id === new URLSearchParams(location.search).get('case')) || scenarios[0];
let state = {
  autoPlayStatus: { isAutoPlay: false },
  sitePage: { siteDomain: 'kabutan.jp', stockCode: '7203' },
  financialStatement: { status: selected.status, results: selected.reports },
};
if (localStorage.getItem('investeeExtensionIsStatementAutoPlay') === null) {
  localStorage.setItem('investeeExtensionIsStatementAutoPlay', 'false');
}
localStorage.setItem('investeeExtensionAnalyticsEnabled', 'false');
const listeners = [];
window.chrome = {
  runtime: {
    id: 'local-test-only',
    onMessage: { addListener: (listener) => listeners.push(listener), removeListener: () => {} },
    sendMessage(...args) {
      const message = args.find((a) => a && typeof a === 'object' && a.type);
      const callback = args.findLast((a) => typeof a === 'function');
      setTimeout(() => {
        if (message.type === 'chromex.fetch_state') {
          callback?.({ type: message.type, payload: structuredClone(state) });
        } else if (message.type === 'chromex.dispatch') {
          if (message.payload.type === 'isAutoPlay/changeAutoPlayStatus') {
            state = { ...state, autoPlayStatus: { isAutoPlay: message.payload.payload } };
          }
          for (const listener of listeners) {
            listener({
              type: 'chromex.state',
              portName: message.portName,
              payload: structuredClone(state),
            });
          }
          callback?.({ value: { payload: message.payload }, error: null });
        }
      }, 0);
    },
  },
};
const nativeFetch = window.fetch;
window.fetch = (url, options) =>
  new URL(url, location.href).origin === location.origin
    ? nativeFetch(url, options)
    : Promise.resolve(new Response(null, { status: 204 }));
await import(document.querySelector('script[data-popup]').dataset.popup);
