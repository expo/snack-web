import { css, StyleSheet } from 'aphrodite';
import React from 'react';

type Props = {
  color: {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  };
  segments: number;
  segmentWidth: number;
  segmentLength: number;
  spacing: number;
  fadeTo: number;
  fadeSteps: number;
};

export default class LoadingIndicator extends React.Component<Props> {
  static defaultProps = {
    color: {
      red: 0,
      green: 0,
      blue: 0,
      alpha: 98 / 255,
    },
    segments: 12,
    segmentWidth: 2,
    segmentLength: 3,
    spacing: 2,
    fadeTo: 31 / 98,
    fadeSteps: 6,
  };

  render() {
    const segmentCount = this.props.segments;
    const segmentWidth = this.props.segmentWidth;
    const segmentLength = this.props.segmentLength;
    const innerRadius = segmentWidth * 2 + this.props.spacing;

    const opacityDelta = (1 - this.props.fadeTo) / this.props.fadeSteps;

    const segments = [];
    for (let ii = 0; ii < segmentCount; ii++) {
      const opacity = 1 - Math.min(ii, this.props.fadeSteps) * opacityDelta;
      const rotation = (-ii * 360) / segmentCount;
      segments.push(
        <line
          key={ii}
          x1="0"
          y1={innerRadius}
          x2="0"
          y2={innerRadius + segmentLength}
          style={{ opacity }}
          transform={`rotate(${rotation})`}
        />
      );
    }

    const { red, green, blue, alpha } = this.props.color;
    const rgbaColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

    const radius = innerRadius + segmentLength + Math.ceil(segmentWidth / 2);

    return (
      <svg className={css(styles.indicator)} width={radius * 2} height={radius * 2}>
        <g
          stroke={rgbaColor}
          strokeWidth={segmentWidth}
          strokeLinecap="round"
          transform={`translate(${radius}, ${radius})`}>
          {segments}
        </g>
      </svg>
    );
  }
}

const spinKeyframes = {
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
};

const styles = StyleSheet.create({
  indicator: {
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationName: spinKeyframes,
    animationTimingFunction: 'steps(12)',
  },
});
