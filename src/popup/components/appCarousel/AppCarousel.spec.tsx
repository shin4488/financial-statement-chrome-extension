import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

// フォーカスを受け、支援技術に伝わるスライド。inert の中はどちらからも外れるが、jsdom はその効果を再現しないため、inert の外にあるかで見分ける
function exposedSlides() {
  return screen
    .getAllByRole('region', { hidden: true })
    .filter((slide) => slide.closest('[inert]') === null)
    .map((slide) => slide.getAttribute('aria-label'));
}

function settle() {
  act(() => {
    vi.advanceTimersByTime(200);
  });
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
    ],
  });
});
afterEach(() => {
  cleanup();
  // 作り直す順番待ちの処理を最後まで進め、次のテストに持ち越さない
  if (vi.isFakeTimers()) {
    vi.runAllTimers();
  }
  vi.useRealTimers();
});

let mounts = 0;
// 作られるたびに番号が変わるスライド。作り直したかを番号で確かめる
function NumberedSlide({ name }: { name: string }) {
  const [id] = React.useState(() => (mounts += 1));
  return <section aria-label={name}>{`${name}-${id}`}</section>;
}

// 自動切替で同時に切り替わる2枚のカード
function renderCards() {
  render(
    <>
      {['1枚目', '2枚目'].map((card) => (
        <div key={card} data-testid={card}>
          <AppCarousel isAutoPlay>
            <NumberedSlide name={`${card}BS`} />
            <NumberedSlide name={`${card}PL`} />
          </AppCarousel>
        </div>
      ))}
    </>,
  );
}

// スライドの中身。作り直すと番号が変わる
function slideText(name: string) {
  return screen.getByLabelText(name).textContent;
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

// 自動切替で次へ進み、出ていくスライドのアニメーションが終わるまで
function autoPlayOnce() {
  advance(5000);
  advance(100);
}

it('全カードが同時に切り替わったとき、隠れたスライドは1フレームに1枚ずつ作り直す', () => {
  renderCards();
  const before = [slideText('1枚目BS'), slideText('2枚目BS')];
  autoPlayOnce();
  advance(0);
  expect(slideText('1枚目BS')).not.toBe(before[0]);
  expect(slideText('2枚目BS')).toBe(before[1]);
  advance(20);
  expect(slideText('2枚目BS')).not.toBe(before[1]);
});

it('マウスを重ねているカードは、隠れたスライドを順番を待たずに作り直す', () => {
  renderCards();
  const before = slideText('2枚目BS');
  fireEvent.mouseEnter(screen.getByLabelText('2枚目BS'));
  autoPlayOnce();
  expect(slideText('2枚目BS')).not.toBe(before);
});

it('作り直す順番を待っている隠れたスライドを表示に戻すときは、表示する前に作り直す', () => {
  renderCards();
  const before = slideText('2枚目BS');
  autoPlayOnce();
  expect(slideText('2枚目BS')).toBe(before);
  fireEvent.click(
    within(screen.getByTestId('2枚目')).getByRole('button', { name: 'carousel indicator 1' }),
  );
  expect(slideText('2枚目BS')).not.toBe(before);
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

it('表示中のスライドだけを見せ、隠れたスライドは切替中に出ていくものも含めて、フォーカスを受けず支援技術からも隠れる', () => {
  renderCarousel();
  expect(exposedSlides()).toEqual(['BS']);
  expect(screen.getByText('PL')).not.toBeVisible();
  click('Next');
  expect(exposedSlides()).toEqual(['PL']);
  settle();
  expect(exposedSlides()).toEqual(['PL']);
  expect(screen.getByText('PL')).toBeVisible();
  expect(screen.getByText('BS')).not.toBeVisible();
});

it('フォーカスのある要素を含むスライドが自動切替で隠れると、その要素はフォーカスを受けない状態になり、aria-hidden の中には残らない', () => {
  render(
    <AppCarousel isAutoPlay>
      <button type="button">BS</button>
      <button type="button">PL</button>
    </AppCarousel>,
  );
  const focused = screen.getByRole('button', { name: 'BS' });
  focused.focus();
  advance(5000);
  // Chrome は、フォーカスのある要素を中に含む aria-hidden を無視して警告する。inert の中の要素からはフォーカスが外れる
  expect(focused.closest('[inert]')).not.toBeNull();
  expect(focused.closest('[aria-hidden="true"]')).toBeNull();
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
