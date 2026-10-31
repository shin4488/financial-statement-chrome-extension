import { createContext, type RefObject } from 'react';

// ポップアップで縦にスクロールする領域。窓に収めるため、文書ではなくこの領域がスクロールする
export const ScrollRootContext = createContext<RefObject<HTMLElement | null> | null>(null);
