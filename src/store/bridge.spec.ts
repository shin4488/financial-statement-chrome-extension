import { configureStore } from '@reduxjs/toolkit';
import { connectStore, exposeStore } from './bridge';
import financialStatement, { setStatus } from './slices/financialStatement';
import sitePage, { changeStockCode } from './slices/sitePageSlice';

const runtime = vi.hoisted(() => {
  type Listener = (message?: unknown) => void;
  type Port = ReturnType<typeof createPort>;
  const createEvent = () => {
    const listeners = new Set<Listener>();
    return {
      listeners,
      addListener: (listener: Listener) => listeners.add(listener),
      emit: (message?: unknown) => listeners.forEach((listener) => listener(message)),
    };
  };
  const createPort = (name: string) => ({
    name,
    onMessage: createEvent(),
    onDisconnect: createEvent(),
    postMessage: (_message: unknown) => {},
    disconnect: () => {},
  });
  // 拡張のメッセージは非同期に、JSON 相当で複製されて相手側へ届く
  const deliver = (callback: () => void) => setTimeout(callback);
  const connectListeners: ((port: Port) => void)[] = [];
  const backgroundPorts: Port[] = [];
  const onMessage = createEvent();
  return {
    backgroundPorts,
    // service worker の停止を模す: 接続中のポートを切断し、以降の接続は起動し直した background だけが受ける
    stopBackground: () => {
      connectListeners.length = 0;
      backgroundPorts.splice(0).forEach((port) => port.disconnect());
    },
    // 前のテストで開いたポップアップに、以降のメッセージを届けない
    closePopups: () => onMessage.listeners.clear(),
    api: {
      onConnect: {
        addListener: (listener: (port: Port) => void) => connectListeners.push(listener),
      },
      connect: ({ name }: { name: string }) => {
        const [popupEnd, backgroundEnd] = [createPort(name), createPort(name)];
        let open = true;
        [popupEnd, backgroundEnd].forEach((end, index) => {
          const other = index === 0 ? backgroundEnd : popupEnd;
          end.postMessage = (message) =>
            open && deliver(() => other.onMessage.emit(structuredClone(message)));
          // 切断した側には onDisconnect が発生せず、以降のメッセージはどちらへも届かない
          end.disconnect = () => {
            open = false;
            deliver(() => other.onDisconnect.emit());
          };
        });
        backgroundPorts.push(backgroundEnd);
        deliver(() => connectListeners.forEach((listener) => listener(backgroundEnd)));
        return popupEnd;
      },
      onMessage,
      // background からは開いている拡張ページへ届く。受け手がいなければ失敗する
      sendMessage: (message: unknown) => {
        if (onMessage.listeners.size === 0) {
          return Promise.reject(new Error('Receiving end does not exist.'));
        }
        deliver(() => onMessage.emit(structuredClone(message)));
        return Promise.resolve();
      },
    },
  };
});
vi.mock('webextension-polyfill', () => ({ default: { runtime: runtime.api } }));

// service worker の起動を模す: 動いている background を止め、初期状態の store で始める
const startBackground = (options?: Parameters<typeof exposeStore>[1]) => {
  runtime.stopBackground();
  const background = configureStore({ reducer: { financialStatement, sitePage } });
  exposeStore(background, options);
  return background;
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 10));

beforeEach(() => runtime.closePopups());

it('mirrors the background state and forwards popup dispatches to the background store', async () => {
  const background = startBackground();
  background.dispatch(setStatus('loading'));
  const popup = await connectStore();
  expect(popup.getState()).toEqual(background.getState());

  popup.dispatch(changeStockCode('7203'));
  await vi.waitFor(() => expect(background.getState().sitePage.stockCode).toBe('7203'));
  await vi.waitFor(() => expect(popup.getState().sitePage.stockCode).toBe('7203'));

  background.dispatch(setStatus('error'));
  await vi.waitFor(() => expect(popup.getState().financialStatement.status).toBe('error'));
});

it('keeps the last state after the background disconnects and reconnects on the next dispatch', async () => {
  const background = startBackground();
  background.dispatch(setStatus('error'));
  const popup = await connectStore();
  runtime.backgroundPorts[0].disconnect();
  background.dispatch(setStatus('success'));
  await flush();
  expect(popup.getState().financialStatement.status).toBe('error');
  expect(runtime.backgroundPorts).toHaveLength(1);

  popup.dispatch(changeStockCode('6758'));
  await vi.waitFor(() => expect(background.getState().sitePage.stockCode).toBe('6758'));
  expect(runtime.backgroundPorts).toHaveLength(2);
  await vi.waitFor(() => expect(popup.getState().financialStatement.status).toBe('success'));
  expect(popup.getState().sitePage.stockCode).toBe('6758');
});

it('sends the restarted background state only after it has been restored', async () => {
  let finishRestore = () => {};
  const restarted = startBackground({
    ready: new Promise<void>((resolve) => {
      finishRestore = () => {
        restarted.dispatch(changeStockCode('7203'));
        restarted.dispatch(setStatus('error'));
        resolve();
      };
    }),
  });
  let popup: Awaited<ReturnType<typeof connectStore>> | undefined;
  void connectStore().then((store) => (popup = store));
  await flush();
  expect(popup).toBeUndefined();

  finishRestore();
  await vi.waitFor(() => expect(popup).toBeDefined());
  expect(popup?.getState()).toEqual(restarted.getState());
});

it('reconnects as soon as the background starts again while the popup stays open', async () => {
  startBackground().dispatch(changeStockCode('7203'));
  const popup = await connectStore();

  // 停止中に別銘柄へ移り、そのタブの変化で起動し直した background
  const restarted = startBackground();
  restarted.dispatch(changeStockCode('6758'));
  await vi.waitFor(() => expect(popup.getState().sitePage.stockCode).toBe('6758'));
  restarted.dispatch(setStatus('success'));
  await vi.waitFor(() => expect(popup.getState().financialStatement.status).toBe('success'));
});

it('does not connect twice when the popup itself started the background', async () => {
  runtime.stopBackground();
  // ポップアップの接続で、停止していた service worker が起動する
  const connecting = connectStore();
  const background = configureStore({ reducer: { financialStatement, sitePage } });
  exposeStore(background);
  const popup = await connecting;
  await flush();
  expect(runtime.backgroundPorts).toHaveLength(1);
  background.dispatch(setStatus('empty'));
  await vi.waitFor(() => expect(popup.getState().financialStatement.status).toBe('empty'));
});

it('tells the background each time a popup connects, including after the background restarts', async () => {
  const onConnect = vi.fn();
  startBackground({ onConnect });
  const popup = await connectStore();
  expect(onConnect).toHaveBeenCalledTimes(1);

  const onReconnect = vi.fn();
  startBackground({ onConnect: onReconnect });
  await vi.waitFor(() => expect(onReconnect).toHaveBeenCalledTimes(1));
  popup.dispatch(changeStockCode('6758'));
  await flush();
  expect(onReconnect).toHaveBeenCalledTimes(1);
  expect(onConnect).toHaveBeenCalledTimes(1);
});
