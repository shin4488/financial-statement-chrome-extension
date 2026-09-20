import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChangeFinancialStatementAction } from './action';
import { FinancialStatementResult } from '@/background/financialStatement/result';

export type ReportStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export const financialStatementSlice = createSlice({
  name: 'financialStatement',
  initialState: {
    results: [] as FinancialStatementResult[],
    status: 'idle' as ReportStatus,
  },
  reducers: {
    setStatus: (state, action: PayloadAction<ReportStatus>) => {
      state.status = action.payload;
      if (action.payload !== 'success') {
        state.results = [];
      }
    },
    setResult: (state, action: ChangeFinancialStatementAction) => {
      state.results = action.payload;
      state.status = action.payload.length ? 'success' : 'empty';
    },
  },
});

export const { setResult, setStatus } = financialStatementSlice.actions;
export default financialStatementSlice.reducer;
