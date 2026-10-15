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

// MV3 では起動直後の接続を取りこぼさないよう、service worker の初期化時に同期的に呼ぶ
export const exposeStore = (store: AppStore) => {
  browser.runtime.onConnect.addListener((port: Runtime.Port) => {
    if (port.name !== portName) {
      return;
    }
    const send = () => port.postMessage(store.getState());
    const unsubscribe = store.subscribe(send);
    port.onMessage.addListener((action) => {
      store.dispatch(action as UnknownAction);
    });
    port.onDisconnect.addListener(unsubscribe);
    send();
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
