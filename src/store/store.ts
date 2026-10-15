import { combineReducers, configureStore, type Action, type ThunkAction } from '@reduxjs/toolkit';

import financialStatementReducer from './slices/financialStatement';
import sitePageReducer from './slices/sitePageSlice';

const store = configureStore({
  reducer: combineReducers({
    financialStatement: financialStatementReducer,
    sitePage: sitePageReducer,
  }),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;
