import React from 'react';
import { trackEvent, EventParams } from '../../analytics';
import Carousel from 'react-material-ui-carousel';
import { AppCarouselProps } from './props';

export default class AppCarousel extends React.Component<AppCarouselProps> {
  private manualNavigation = false;

  render(): React.ReactNode {
    const buttonProps = {
      style: { opacity: 0.2 },
      onClickCapture: () => {
        this.manualNavigation = true;
      },
    };
    const indicatorProps = { className: '', onClickCapture: buttonProps.onClickCapture };
    return (
      <Carousel
        onChange={(now, previous) => {
          if (this.manualNavigation && now !== previous) {
            const chartTypes: EventParams['chart_type'][] = ['bs', 'pl', 'cf', 'indicators'];
            trackEvent('analysis_interaction', {
              interaction_type: 'chart_navigation',
              chart_type: chartTypes[now ?? 0],
            });
          }
          this.manualNavigation = false;
        }}
        indicatorIconButtonProps={indicatorProps}
        autoPlay={this.props.isAutoPlay}
        swipe={false}
        interval={5000}
        stopAutoPlayOnHover={this.props.stopAutoPlayOnHover}
        animation="slide"
        duration={100}
        navButtonsAlwaysVisible
        navButtonsWrapperProps={{
          style: { top: 'auto', bottom: 0, height: 40 },
        }}
        navButtonsProps={buttonProps}
      >
        {this.props.children}
      </Carousel>
    );
  }
}
