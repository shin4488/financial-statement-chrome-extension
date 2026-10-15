import {
  configureStore,
  createAction,
  createReducer,
  Tuple,
  type Middleware,
  type UnknownAction,
} from '@reduxjs/toolkit';
import browser, { type Runtime } from 'webextension-polyfill';
import type { AppStore, RootState } from './store';

// background の store を正とし、ポップアップには状態の写しを渡す。ポップアップの dispatch は background で処理する。
const portName = 'store';
const replaceState = createAction<RootState>('bridge/replaceState');

// MV3 では起動直後の接続を取りこぼさないよう、service worker の初期化時に同期的に呼ぶ。
// ready が解決するまで（store の状態を戻し終えるまで）は、状態を送らず、受け取った dispatch も処理しない
export const exposeStore = (store: AppStore, ready: Promise<void> = Promise.resolve()) => {
  browser.runtime.onConnect.addListener((port: Runtime.Port) => {
    if (port.name !== portName) {
      return;
    }
    let unsubscribe: (() => void) | undefined;
    let connected = true;
    port.onMessage.addListener((action) => {
      void ready.then(() => store.dispatch(action as UnknownAction));
    });
    port.onDisconnect.addListener(() => {
      connected = false;
      unsubscribe?.();
    });
    void ready.then(() => {
      if (!connected) {
        return;
      }
      const send = () => port.postMessage(store.getState());
      unsubscribe = store.subscribe(send);
      send();
    });
  });
};

const createMirrorStore = (state: RootState, forward: Middleware) =>
  configureStore({
    reducer: createReducer(state, (builder) =>
      builder.addCase(replaceState, (_current, action) => action.payload),
    ),
    middleware: () => new Tuple(forward),
  });
export type MirrorStore = ReturnType<typeof createMirrorStore>;

export const connectStore = () =>
  new Promise<MirrorStore>((resolve) => {
    let store: MirrorStore | undefined;
    const connect = () => {
      const port = browser.runtime.connect({ name: portName });
      port.onMessage.addListener((message) => {
        if (store === undefined) {
          store = createMirrorStore(message as RootState, forward);
          resolve(store);
          return;
        }
        store.dispatch(replaceState(message as RootState));
      });
      // 停止した service worker からは切断される。表示中の状態は保ち、次の dispatch で接続し直して起動させる
      port.onDisconnect.addListener(() => {
        if (connection === port) {
          connection = undefined;
        }
      });
      return port;
    };
    const forward: Middleware = () => (next) => (action) => {
      if (replaceState.match(action)) {
        return next(action);
      }
      connection ??= connect();
      connection.postMessage(action);
      return action;
    };
    let connection: Runtime.Port | undefined = connect();
  });
