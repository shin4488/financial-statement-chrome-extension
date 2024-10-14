import { createSlice } from '@reduxjs/toolkit';
import { ChangeFinancialStatementAction } from './action';
import { FinancialStatementResult } from '@/background/financialStatement/result';

export const financialStatementSlice = createSlice({
  name: 'financialStatement',
  initialState: {
    results: [] as FinancialStatementResult[],
  },
  reducers: {
    setResult: (state, action: ChangeFinancialStatementAction) => {
      state.results = action.payload;
    },
  },
});

export const { setResult } = financialStatementSlice.actions;
export default financialStatementSlice.reducer;
