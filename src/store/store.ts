import {
  combineReducers,
  configureStore,
  createAction,
  type Action,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit';

import financialStatementReducer from './slices/financialStatement';
import sitePageReducer from './slices/sitePageSlice';

const reducer = combineReducers({
  financialStatement: financialStatementReducer,
  sitePage: sitePageReducer,
});
export type RootState = ReturnType<typeof reducer>;

// 停止した service worker が起動し直したときに、停止前の状態へ戻す
export const restoreState = createAction<RootState>('store/restoreState');

const store = configureStore({
  reducer: (state: RootState | undefined, action: UnknownAction) =>
    restoreState.match(action) ? action.payload : reducer(state, action),
});

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;
