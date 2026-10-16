import browser from 'webextension-polyfill';
import { restoreState, type AppStore, type RootState } from '@/store/store';

const sessionKey = 'state';

// 保存に失敗しても、store の更新（dispatch）は止めない。次に起動したときに取り直せば表示できる
const save = async (state: RootState) => browser.storage.session.set({ [sessionKey]: state });

// service worker はアイドルが続くと停止し、メモリ上の store は初期状態に戻る。
// ブラウザを閉じるまで状態を storage.session に残し、起動し直したら戻す。
// 戻した後は同じページで財務データを取り直さず、開いているポップアップの表示も初期状態に戻らない
export const restoreSessionState = async (store: AppStore) => {
  try {
    const { [sessionKey]: saved } = await browser.storage.session.get(sessionKey);
    // 取得中に停止した要求は結果が届かないため、戻さずに取り直させる
    if (saved !== undefined && (saved as RootState).financialStatement.status !== 'loading') {
      store.dispatch(restoreState(saved as RootState));
    }
  } catch {
    // 戻せなくても、取り直せば表示できる
  }
  let lastSaved = store.getState();
  store.subscribe(() => {
    const state = store.getState();
    if (state === lastSaved) {
      return;
    }
    lastSaved = state;
    save(state).catch(() => undefined);
  });
};
