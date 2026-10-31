import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ScrollRootContext } from './defaultLayout/scrollRoot';
import { waitForTurn } from './drawQueue';

// 置いた時点で、スクロールする領域の表示範囲とその下の高さの0.3倍までにある要素は、最初の表示から描く。
// スクロールで次のフレームに見えてくることがあるため。広げるほど、最初の表示までに描く要素が増える
const drawAtOnceScreens = 1.3;

// 要素の中身を描いてよいかを返す。全要素を一度に描くと、その間は表示が止まるため、
// スクロールする領域の表示範囲の近くの要素は最初の表示から描き、ほかの要素は置いた順に1フレームに1つずつ描く。
// 順番を待つ間に見えてきた要素は、順番を待たずに描く
export function useStaggeredDraw<T extends Element>() {
  const ref = useRef<T>(null);
  const scrollRoot = useContext(ScrollRootContext);
  const [drawn, setDrawn] = useState(false);
  useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    // 置いた時点ではスクロールする領域の要素がまだ決まっていないことがあるため、そのときは窓で見る
    const view = scrollRoot?.current?.getBoundingClientRect() ?? {
      top: 0,
      height: window.innerHeight,
    };
    if (rect && rect.bottom > view.top && rect.top < view.top + view.height * drawAtOnceScreens) {
      setDrawn(true);
    }
  }, [scrollRoot]);
  useEffect(() => {
    const element = ref.current;
    if (drawn || !element) {
      return;
    }
    const draw = () => flushSync(() => setDrawn(true));
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          draw();
        }
      },
      { root: scrollRoot?.current ?? null },
    );
    observer.observe(element);
    const leaveQueue = waitForTurn(draw);
    return () => {
      observer.disconnect();
      leaveQueue();
    };
  }, [drawn, scrollRoot]);
  return [ref, drawn] as const;
}
