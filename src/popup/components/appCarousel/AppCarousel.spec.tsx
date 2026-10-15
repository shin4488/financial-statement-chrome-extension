import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AppCarousel from './AppCarousel';

vi.mock('../../analytics', () => ({ trackEvent: vi.fn() }));

// チャートのツールチップと同じく、マウスが入ると表示が変わり、マウスが離れたことを受け取るまで戻らないスライド
function HoverSlide({ name }: { name: string }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {hovered ? `${name}（ホバー中）` : name}
    </div>
  );
}

function renderCarousel() {
  render(
    <AppCarousel isAutoPlay={false}>
      <HoverSlide name="BS" />
      <HoverSlide name="PL" />
      <HoverSlide name="CF" />
    </AppCarousel>,
  );
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

function settle() {
  act(() => {
    vi.advanceTimersByTime(200);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

it.each([
  {
    case: '切替が終わってから戻る',
    leave: () => {
      click('Next');
      settle();
    },
  },
  {
    case: '退出中にさらに次へ進んでから戻る',
    leave: () => {
      click('Next');
      click('Next');
      settle();
    },
  },
])(
  'マウスが離れたことを受け取らずに隠れたスライドは、表示に戻すと操作前の状態で表示する（$case）',
  ({ leave }) => {
    renderCarousel();
    fireEvent.mouseEnter(screen.getByText('BS'));
    expect(screen.getByText('BS（ホバー中）')).toBeVisible();
    leave();
    click('carousel indicator 1');
    settle();
    expect(screen.getByText('BS')).toBeVisible();
  },
);
