import React from 'react';
import { flushSync } from 'react-dom';
import { Box, IconButton, keyframes } from '@mui/material';
import { createSvgIcon } from '@mui/material/utils';
import { trackEvent, EventParams } from '../../analytics';
import { waitForTurn } from '../drawQueue';
import { AppCarouselProps } from './props';

const NavigateBefore = createSvgIcon(
  <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />,
  'NavigateBefore',
);
const NavigateNext = createSvgIcon(
  <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />,
  'NavigateNext',
);
const Dot = createSvgIcon(<circle cx="12" cy="12" r="8" />, 'FiberManualRecord');

// 計測で送るグラフの種類。添字で FinancialStatementList が渡すスライドと対応付けるため、スライドの順と同じ並びにする
const chartTypes: EventParams['chart_type'][] = ['bs', 'pl', 'cf', 'fcf', 'indicators'];
const interval = 5000;
const duration = 100;
// ナビボタンはカルーセル下端の帯に置かれる。インジケータ行を同じ高さにしないと、ボタンが行からスライド側へはみ出し、幅の狭いポップアップではチャートの下端に重なる
const navRowHeight = 40;
const slide = {
  enterFromRight: keyframes`from { transform: translateX(100%); }`,
  enterFromLeft: keyframes`from { transform: translateX(-100%); }`,
  exitToLeft: keyframes`to { transform: translateX(-100%); }`,
  exitToRight: keyframes`to { transform: translateX(100%); }`,
};
const navButtonSx = {
  position: 'absolute',
  bottom: 0,
  zIndex: 1,
  mx: '10px',
  opacity: 0.2,
  color: 'white',
  bgcolor: '#494949',
  transition: '200ms',
  '&:hover': { opacity: 0.6, bgcolor: 'black', filter: 'brightness(120%)' },
} as const;

interface AppCarouselState {
  active: number;
  // 切替中だけ、直前のスライドを退出アニメーションのために表示する
  previous: number | null;
  forward: boolean;
  // スライドごとの key。表示から外れるたびに変えて、スライドを作り直す
  generations: number[];
}

// 表示から外れたスライドは作り直し、ツールチップの表示などの操作中の状態を次の表示へ持ち越さない。
// マウスを動かさずに切り替えると、隠れたスライドにマウスが離れたことが届くとは限らない。
// Recharts のツールチップは visibility を自身で指定するため、状態が残ると隠れたスライドからも見える
function hide(generations: number[], index: number | null): number[] {
  if (index === null) {
    return generations;
  }
  const next = [...generations];
  next[index] = (next[index] ?? 0) + 1;
  return next;
}

export default class AppCarousel extends React.Component<AppCarouselProps, AppCarouselState> {
  state: AppCarouselState = { active: 0, previous: null, forward: true, generations: [] };
  private autoPlayTimer?: ReturnType<typeof setInterval>;
  private exitTimer?: ReturnType<typeof setTimeout>;
  // 作り直す順番を待っているスライドと、その順番待ちから外れる処理
  private pendingResets = new Map<number, () => void>();
  private hovered = false;

  componentDidMount(): void {
    this.autoPlayTimer = setInterval(() => {
      if (this.props.isAutoPlay) {
        this.move(1);
      }
    }, interval);
  }

  componentWillUnmount(): void {
    clearInterval(this.autoPlayTimer);
    clearTimeout(this.exitTimer);
    this.pendingResets.forEach((leaveQueue) => leaveQueue());
  }

  private get count(): number {
    return React.Children.count(this.props.children);
  }

  private show(index: number, forward: boolean, manual: boolean): void {
    if (index === this.state.active) {
      return;
    }
    if (manual) {
      trackEvent('analysis_interaction', {
        interaction_type: 'chart_navigation',
        chart_type: chartTypes[index],
      });
    }
    clearTimeout(this.exitTimer);
    // 作り直す順番を待っているスライドを表示に戻すときは、表示する前に作り直す
    const leaveQueue = this.pendingResets.get(index);
    this.pendingResets.delete(index);
    leaveQueue?.();
    // 退出中に次の切替が来たら、退出中だったスライドはここで表示から外れる
    let exiting: number | null = null;
    this.setState(
      (state) => {
        exiting = state.previous === index ? null : state.previous;
        return {
          active: index,
          previous: state.active,
          forward,
          generations: leaveQueue ? hide(state.generations, index) : state.generations,
        };
      },
      () => this.resetLater(exiting),
    );
    this.exitTimer = setTimeout(() => {
      let leaving: number | null = null;
      this.setState(
        ({ previous }) => {
          leaving = previous;
          return { previous: null };
        },
        () => this.resetLater(leaving),
      );
    }, duration);
  }

  // 表示から外れたスライドを作り直す。隠れたスライドは見えないため順番を待って作り直し、
  // 全カードが同時に切り替わる自動切替で、全カードのグラフを一度に作り直さないようにする。
  // マウスを重ねている間は、隠れたスライドにツールチップが残らないよう、待たずに作り直す
  private resetLater(index: number | null): void {
    if (index === null || this.pendingResets.has(index)) {
      return;
    }
    const reset = () =>
      this.setState(({ generations }) => ({ generations: hide(generations, index) }));
    if (this.hovered) {
      reset();
      return;
    }
    this.pendingResets.set(
      index,
      waitForTurn(() => {
        this.pendingResets.delete(index);
        flushSync(reset);
      }),
    );
  }

  private move(step: 1 | -1, manual = false): void {
    this.show((this.state.active + step + this.count) % this.count, step === 1, manual);
  }

  render(): React.ReactNode {
    const { active, previous, forward, generations } = this.state;
    const animation = `${duration}ms ease-in-out`;
    return (
      <Box
        position="relative"
        overflow="hidden"
        onMouseEnter={() => {
          this.hovered = true;
        }}
        onMouseLeave={() => {
          this.hovered = false;
        }}
      >
        {/* 全スライドを同じセルに重ね、高さを最も高いスライドに揃える。表示中のスライドの高さに合わせると、切替のたびに下端のナビボタンが上下に動き、出ていくスライドがナビ行に重なる */}
        <Box display="grid" gridTemplateColumns="minmax(0, 1fr)">
          {React.Children.map(this.props.children, (child, index) => {
            const leaving = index === previous;
            let slideAnimation: string | undefined;
            if (index === active && previous !== null) {
              slideAnimation = `${forward ? slide.enterFromRight : slide.enterFromLeft} ${animation}`;
            } else if (leaving) {
              slideAnimation = `${forward ? slide.exitToLeft : slide.exitToRight} ${animation} forwards`;
            }
            return (
              <Box
                key={generations[index] ?? 0}
                aria-hidden={index === active ? undefined : true}
                sx={{
                  gridArea: '1 / 1',
                  visibility: index === active || leaving ? undefined : 'hidden',
                  animation: slideAnimation,
                }}
              >
                {child}
              </Box>
            );
          })}
        </Box>
        <IconButton
          aria-label="Previous"
          onClick={() => this.move(-1, true)}
          sx={{ ...navButtonSx, left: 0 }}
        >
          <NavigateBefore />
        </IconButton>
        <IconButton
          aria-label="Next"
          onClick={() => this.move(1, true)}
          sx={{ ...navButtonSx, right: 0 }}
        >
          <NavigateNext />
        </IconButton>
        <Box height={navRowHeight} display="flex" alignItems="center" justifyContent="center">
          {Array.from({ length: this.count }, (_, index) => (
            <IconButton
              key={index}
              aria-label={`carousel indicator ${index + 1}`}
              onClick={() => this.show(index, index > active, true)}
              sx={{
                p: 0,
                transition: '200ms',
                color: index === active ? '#494949' : '#afafaf',
                '&:hover': { color: index === active ? '#494949' : '#1f1f1f' },
              }}
            >
              <Dot sx={{ fontSize: 15 }} />
            </IconButton>
          ))}
        </Box>
      </Box>
    );
  }
}
