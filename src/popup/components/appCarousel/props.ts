import { childrenComponentType } from '@/popup/types';

export interface AppCarouselProps {
  children: childrenComponentType;
  stopAutoPlayOnHover?: boolean;
  isAutoPlay?: boolean;
}
