/* @flow */

import { css, StyleSheet } from 'aphrodite';
import React from 'react';

type Props = {
  color: {
    red: number,
    green: number,
    blue: number,
    alpha: number,
  },
  segments: number,
  segmentWidth: number,
  segmentLength: number,
  spacing: number,
  fadeTo: number,
  fadeSteps: number,
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
    let segmentCount = this.props.segments;
    let segmentWidth = this.props.segmentWidth;
    let segmentLength = this.props.segmentLength;
    let innerRadius = segmentWidth * 2 + this.props.spacing;

    let opacityDelta = (1 - this.props.fadeTo) / this.props.fadeSteps;

    let segments = [];
    for (let ii = 0; ii < segmentCount; ii++) {
      let opacity = 1 - Math.min(ii, this.props.fadeSteps) * opacityDelta;
      let rotation = -ii * 360 / segmentCount;
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

    let { red, green, blue, alpha } = this.props.color;
    let rgbaColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

    let radius = innerRadius + segmentLength + Math.ceil(segmentWidth / 2);

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
