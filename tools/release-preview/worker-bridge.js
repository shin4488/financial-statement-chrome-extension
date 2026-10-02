const events = () => {
  const listeners = [];
  return {
    addListener: (fn) => listeners.push(fn),
    removeListener: () => {},
    hasListener: (fn) => listeners.includes(fn),
    emit: () => Promise.all(listeners.map((fn) => fn())),
  };
};
const onMessage = events(),
  onUpdated = events(),
  onActivated = events(),
  onFocusChanged = events();
let activeURL = 'https://example.invalid/',
  outcome = 'normal',
  holdResponse = false,
  enabled = false;
let releaseResponse;
const requests = [];
const scenarios = await (await fetch('/fixtures.json')).json();
const persisted = {
  'persist:root': JSON.stringify({
    autoPlayStatus: JSON.stringify({ isAutoPlay: false }),
    financialStatement: JSON.stringify({ status: 'success', results: [{ id: 'stale-report' }] }),
    sitePage: JSON.stringify({ stockCode: '9999', siteDomain: 'old.invalid' }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  }),
};
const callback = (args) => args.findLast((arg) => typeof arg === 'function');
const storage = {
  get(keys, cb) {
    const result = typeof keys === 'string' ? { [keys]: persisted[keys] } : { ...persisted };
    setTimeout(() => cb(result), 0);
  },
  set(values, cb) {
    Object.assign(persisted, values);
    cb?.();
  },
  remove(key, cb) {
    delete persisted[key];
    cb?.();
  },
};
self.chrome = {
  runtime: {
    id: 'local-test-only',
    onMessage,
    lastError: undefined,
    sendMessage(...args) {
      callback(args)?.();
    },
  },
  storage: { local: storage, sync: storage, onChanged: events() },
  tabs: {
    query(filter, cb) {
      cb(filter.active ? [{ id: 1, url: activeURL }] : []);
    },
    onUpdated,
    onActivated,
    sendMessage(...args) {
      callback(args)?.();
    },
  },
  windows: { onFocusChanged },
  action: {
    enable(...args) {
      enabled = true;
      callback(args)?.();
    },
    disable(...args) {
      enabled = false;
      callback(args)?.();
    },
  },
};
self.fetch = async (url, options) => {
  if (String(url) !== 'https://investee.info/api/graphql') {
    throw Error('Unexpected external endpoint');
  }
  const body = JSON.parse(options.body),
    scenario = outcome,
    held = holdResponse;
  requests.push({ url: String(url), variables: body.variables, query: body.query });
  if (held) {
    await new Promise((resolve) => {
      releaseResponse = resolve;
    });
  }
  if (scenario === 'network-error') {
    throw Error('simulated offline');
  }
  if (scenario === 'graphql-error') {
    return new Response(JSON.stringify({ errors: [{ message: 'simulated API failure' }] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const reports =
    scenario === 'empty' ? [] : (scenarios.find((s) => s.id === scenario) || scenarios[0]).reports;
  return new Response(JSON.stringify({ data: { financialReports: reports } }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
function snapshot() {
  let state;
  for (const fn of onMessageListeners()) {
    fn({ type: 'chromex.fetch_state', portName: 'chromex.port_name' }, {}, (message) => {
      state = message.payload;
    });
  }
  return { state, enabled, requests: structuredClone(requests) };
}
const originalAdd = onMessage.addListener,
  messageListeners = [];
onMessage.addListener = (fn) => {
  messageListeners.push(fn);
  originalAdd(fn);
};
const onMessageListeners = () => messageListeners;
await import('/service-worker-loader.js');
await new Promise((resolve) => setTimeout(resolve, 30));
self.postMessage({ ready: true });
self.onmessage = async ({ data }) => {
  try {
    if (data.command === 'tab') {
      activeURL = data.url;
      outcome = data.outcome || 'normal';
      holdResponse = data.hold || false;
      await onUpdated.emit();
    } else if (data.command === 'repeat') {
      await onUpdated.emit();
    } else if (data.command === 'release') {
      releaseResponse?.();
      releaseResponse = undefined;
    }
    self.postMessage({ id: data.id, value: snapshot() });
  } catch (error) {
    self.postMessage({ id: data.id, error: String(error) });
  }
};
