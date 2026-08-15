import { createSlice } from '@reduxjs/toolkit';
import { ChangeSiteDomainAction, ChangeStockCodeAction } from './action';

export const SitePageSlice = createSlice({
  name: 'siteDomain',
  initialState: {
    siteDomain: '',
    stockCode: '',
  },
  reducers: {
    changeSiteDomain: (state, action: ChangeSiteDomainAction) => {
      state.siteDomain = action.payload;
    },
    changeStockCode: (state, action: ChangeStockCodeAction) => {
      state.stockCode = action.payload;
    },
  },
});

export const { changeSiteDomain, changeStockCode } = SitePageSlice.actions;
export default SitePageSlice.reducer;
