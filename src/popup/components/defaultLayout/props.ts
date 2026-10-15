import { childrenComponentType } from '@/popup/types';

export interface DefaultLayoutProps {
  children: childrenComponentType;
  isAutoPlay: boolean;
  onAutoPlayChange: (isAutoPlay: boolean) => void;
}
