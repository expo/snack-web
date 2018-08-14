/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import colors from '../../configs/colors';

type Props = {
  duration: string,
  className?: string,
};

export default function ProgressIndicator({ duration, className }: Props) {
  return (
    <div
      className={classnames(css(styles.progress), className)}
      style={{ animationDuration: duration }}
    />
  );
}

ProgressIndicator.defaultProps = {
  duration: '2s',
};

const progressKeyframes = {
  '0%': {
    transform: 'scale3d(0, 1, 1)',
    opacity: 1,
  },

  '75%': {
    transform: 'scale3d(1, 1, 1)',
    opacity: 1,
  },

  '100%': {
    transform: 'scale3d(1, 1, 1)',
    opacity: 0,
  },
};

const styles = StyleSheet.create({
  progress: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    zIndex: 1,
    backgroundColor: colors.primary,
    transformOrigin: 'top left',
    animationName: [progressKeyframes],
    animationIterationCount: 'infinite',
  },
});
