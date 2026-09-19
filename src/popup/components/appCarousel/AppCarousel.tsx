import React from 'react';
import Carousel from 'react-material-ui-carousel';
import { AppCarouselProps } from './props';

export default class AppCarousel extends React.Component<AppCarouselProps> {
  render(): React.ReactNode {
    return (
      <Carousel
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
        navButtonsProps={{ style: { opacity: 0.2 } }}
      >
        {this.props.children}
      </Carousel>
    );
  }
}
