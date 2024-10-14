import { childrenComponentType } from '@/app/constants/types';

export interface AppCarouselProps {
  children: childrenComponentType;
  stopAutoPlayOnHover?: boolean;
  isAutoPlay?: boolean;
}
