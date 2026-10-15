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
  return {
    backgroundPorts,
    // service worker の停止を模す: 接続中のポートを切断し、以降の接続は起動し直した background だけが受ける
    stopBackground: () => {
      connectListeners.length = 0;
      backgroundPorts.forEach((port) => port.disconnect());
    },
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
    },
  };
});
vi.mock('webextension-polyfill', () => ({ default: { runtime: runtime.api } }));

const background = configureStore({ reducer: { financialStatement, sitePage } });
exposeStore(background);

it('mirrors the background state and forwards popup dispatches to the background store', async () => {
  background.dispatch(setStatus('loading'));
  const popup = await connectStore();
  expect(popup.getState()).toEqual(background.getState());

  popup.dispatch(changeStockCode('7203'));
  await vi.waitFor(() => expect(background.getState().sitePage.stockCode).toBe('7203'));
  await vi.waitFor(() => expect(popup.getState().sitePage.stockCode).toBe('7203'));

  background.dispatch(setStatus('error'));
  await vi.waitFor(() => expect(popup.getState().financialStatement.status).toBe('error'));
});

it('keeps the last state after the background stops and reconnects on the next dispatch', async () => {
  const popup = await connectStore();
  const connections = runtime.backgroundPorts.length;
  runtime.backgroundPorts[connections - 1].disconnect();
  background.dispatch(setStatus('success'));
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(popup.getState().financialStatement.status).toBe('error');
  expect(runtime.backgroundPorts).toHaveLength(connections);

  popup.dispatch(changeStockCode('6758'));
  await vi.waitFor(() => expect(background.getState().sitePage.stockCode).toBe('6758'));
  expect(runtime.backgroundPorts).toHaveLength(connections + 1);
  await vi.waitFor(() => expect(popup.getState().financialStatement.status).toBe('success'));
  expect(popup.getState().sitePage.stockCode).toBe('6758');
});

it('sends the restarted background state only after it has been restored', async () => {
  runtime.stopBackground();
  const restarted = configureStore({ reducer: { financialStatement, sitePage } });
  let finishRestore = () => {};
  exposeStore(
    restarted,
    new Promise<void>((resolve) => {
      finishRestore = () => {
        restarted.dispatch(changeStockCode('7203'));
        restarted.dispatch(setStatus('error'));
        resolve();
      };
    }),
  );
  let popup: Awaited<ReturnType<typeof connectStore>> | undefined;
  void connectStore().then((store) => (popup = store));
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(popup).toBeUndefined();

  finishRestore();
  await vi.waitFor(() => expect(popup).toBeDefined());
  expect(popup?.getState()).toEqual(restarted.getState());
});
