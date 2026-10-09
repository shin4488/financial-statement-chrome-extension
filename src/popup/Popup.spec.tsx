import React from 'react';
import { act, render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Popup from './Popup';
import { trackEvent } from './analytics';
import financialStatement, { setResult, setStatus } from '@/store/slices/financialStatement';
import autoPlayStatus from '@/store/slices/autoPlayStatusSlice';
import sitePage, { changeSiteDomain, changeStockCode } from '@/store/slices/sitePageSlice';

vi.mock('./analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('./components/defaultLayout/DefaultLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./components/FinancialStatementList', () => ({ default: () => null }));

it('uses the UI store and counts each settled result once even in StrictMode', () => {
  const store = configureStore({ reducer: { financialStatement, autoPlayStatus, sitePage } });
  store.dispatch(changeSiteDomain('kabutan.jp'));
  store.dispatch(changeStockCode('7203'));
  store.dispatch(setStatus('loading'));
  render(
    <React.StrictMode>
      <Provider store={store}>
        <Popup />
      </Provider>
    </React.StrictMode>,
  );
  expect(trackEvent).toHaveBeenCalledTimes(1);
  expect(trackEvent).toHaveBeenCalledWith('popup_open', { site_domain_name: 'kabutan.jp' });
  act(() => {
    store.dispatch(setResult([]));
  });
  expect(trackEvent).toHaveBeenCalledTimes(2);
  expect(trackEvent).toHaveBeenLastCalledWith('report_result', {
    site_domain_name: 'kabutan.jp',
    result_status: 'empty',
    result_count: 0,
    unavailable_count: 0,
  });
  act(() => {
    store.dispatch(setResult([]));
  });
  expect(trackEvent).toHaveBeenCalledTimes(2);
  act(() => {
    store.dispatch(setStatus('error'));
  });
  expect(trackEvent).toHaveBeenLastCalledWith(
    'report_result',
    expect.objectContaining({ result_status: 'error' }),
  );
});
