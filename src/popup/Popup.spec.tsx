import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Popup from './Popup';
import { trackEvent } from './analytics';
import FinancialStatementList from './components/FinancialStatementList';
import financialStatement, { setResult, setStatus } from '@/store/slices/financialStatement';
import sitePage, { changeSiteDomain, changeStockCode } from '@/store/slices/sitePageSlice';

vi.mock('./analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('./components/defaultLayout/DefaultLayout', () => ({
  default: ({
    children,
    isAutoPlay,
    onAutoPlayChange,
  }: {
    children: React.ReactNode;
    isAutoPlay: boolean;
    onAutoPlayChange: (isAutoPlay: boolean) => void;
  }) => (
    <>
      <input
        type="checkbox"
        aria-label="自動切替"
        checked={isAutoPlay}
        onChange={(event) => onAutoPlayChange(event.target.checked)}
      />
      {children}
    </>
  ),
}));
vi.mock('./components/FinancialStatementList', () => ({ default: vi.fn(() => null) }));

const autoPlayStorageKey = 'investeeExtensionIsStatementAutoPlay';
const createStore = () => configureStore({ reducer: { financialStatement, sitePage } });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

it('uses the UI store and counts each settled result once even in StrictMode', () => {
  const store = createStore();
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

it.each([
  { saved: null, isAutoPlay: true },
  { saved: 'true', isAutoPlay: true },
  { saved: 'false', isAutoPlay: false },
])(
  'draws autoplay from the saved preference $saved from the first render',
  ({ saved, isAutoPlay }) => {
    if (saved !== null) {
      localStorage.setItem(autoPlayStorageKey, saved);
    }
    render(
      <Provider store={createStore()}>
        <Popup />
      </Provider>,
    );
    expect(vi.mocked(FinancialStatementList).mock.calls[0][0]).toEqual({ isAutoPlay });
    expect(screen.getByRole('checkbox', { name: '自動切替' })).toHaveProperty(
      'checked',
      isAutoPlay,
    );
  },
);

it('saves the autoplay change and passes it to the charts without the background', () => {
  const store = createStore();
  const dispatch = vi.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <Popup />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('checkbox', { name: '自動切替' }));
  expect(localStorage.getItem(autoPlayStorageKey)).toBe('false');
  expect(vi.mocked(FinancialStatementList).mock.lastCall?.[0]).toEqual({ isAutoPlay: false });
  expect(dispatch).not.toHaveBeenCalled();
});
