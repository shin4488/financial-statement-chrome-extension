import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppCarousel from './AppCarousel';

vi.mock('../../analytics', () => ({ trackEvent: vi.fn() }));

// チャートのツールチップと同じく、マウスが入ると表示が変わり、マウスが離れたことを受け取るまで戻らないスライド
function HoverSlide({ name }: { name: string }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <section
      aria-label={name}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered ? `${name}（ホバー中）` : name}
    </section>
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

function shownSlides() {
  return screen.getAllByRole('region').map((slide) => slide.getAttribute('aria-label'));
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

it('表示中のスライドだけを見せ、切替中に出ていくスライドも支援技術には伝えない', () => {
  renderCarousel();
  expect(shownSlides()).toEqual(['BS']);
  expect(screen.getByText('PL')).not.toBeVisible();
  click('Next');
  expect(shownSlides()).toEqual(['PL']);
  settle();
  expect(shownSlides()).toEqual(['PL']);
  expect(screen.getByText('PL')).toBeVisible();
  expect(screen.getByText('BS')).not.toBeVisible();
});

it('Tab キーでは、表示中のスライドの中の次に、画面の左右の並びと同じ Previous → Next の順に移り、その後にインジケーターへ移る', async () => {
  // user-event はタイマーで操作の完了を待つため、このテストでは実時間で動かす
  vi.useRealTimers();
  const user = userEvent.setup();
  render(
    <AppCarousel isAutoPlay={false}>
      <a href="#bs">BS</a>
      <a href="#pl">PL</a>
      <a href="#cf">CF</a>
    </AppCarousel>,
  );
  const tabOrder = async () => {
    (document.activeElement as HTMLElement).blur();
    const names: (string | null)[] = [];
    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      const focused = document.activeElement as HTMLElement;
      names.push(focused.getAttribute('aria-label') ?? focused.textContent);
    }
    return names;
  };
  const navigation = [
    'Previous',
    'Next',
    'carousel indicator 1',
    'carousel indicator 2',
    'carousel indicator 3',
  ];
  expect(await tabOrder()).toEqual(['BS', ...navigation]);
  await user.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(screen.getByText('BS')).not.toBeVisible());
  expect(await tabOrder()).toEqual(['PL', ...navigation]);
});
