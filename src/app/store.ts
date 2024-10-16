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

import autoPlayStatusReducer from '@/app/slices/autoPlayStatusSlice';
import financialStatementReducer from '@/app/slices/financialStatement';
import sitePageReducer from '@/app/slices/sitePageSlice';

const persistConfig = {
  key: 'root',
  storage: localStorage as WebStorage,
};

const reducers = combineReducers({
  autoPlayStatus: autoPlayStatusReducer,
  financialStatement: financialStatementReducer,
  sitePage: sitePageReducer,
});

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
