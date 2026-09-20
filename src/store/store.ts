import { wrapStore } from '@eduardoac-skimlinks/webext-redux';
import { combineReducers, configureStore, type Action, type ThunkAction } from '@reduxjs/toolkit';
import { localStorage } from 'redux-persist-webextension-storage';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'reduxjs-toolkit-persist';
import type { WebStorage } from 'reduxjs-toolkit-persist/lib/types';

import autoPlayStatusReducer from './slices/autoPlayStatusSlice';
import financialStatementReducer from './slices/financialStatement';
import sitePageReducer from './slices/sitePageSlice';

const reducers = combineReducers({
  autoPlayStatus: autoPlayStatusReducer,
  financialStatement: financialStatementReducer,
  sitePage: sitePageReducer,
});
type AppState = ReturnType<typeof reducers>;

const persistConfig = {
  key: 'root',
  whitelist: ['autoPlayStatus'],
  storage: localStorage as WebStorage,
  // 旧版が保存した財務データ・タブも復元しない。復元待ちの間に届いた最新結果を保つ。
  stateReconciler: (
    inbound: Partial<AppState>,
    _original: AppState,
    current: AppState,
  ): AppState => ({
    ...current,
    autoPlayStatus: inbound.autoPlayStatus ?? current.autoPlayStatus,
  }),
};

const persistedReducer: typeof reducers = persistReducer(persistConfig, reducers);
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const initializeWrappedStore = () => wrapStore(store);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;
