/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';

type Props = {
  className?: string,
  children?: any,
};

const rotate = {
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
};

const LoadingText = ({ children, className }: Props) => (
  <div className={classnames(css(styles.loading), className)}>{children}</div>
);

export default LoadingText;

const styles = StyleSheet.create({
  loading: {
    ':before': {
      display: 'inline-block',
      content: '""',
      borderWidth: 2,
      borderStyle: 'solid',
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
      borderRightColor: 'rgba(255, 255, 255, 0.2)',
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
      borderLeftColor: 'rgba(255, 255, 255, 0.5)',
      height: 16,
      width: 16,
      borderRadius: '50%',
      marginLeft: '.5em',
      marginRight: '1em',
      verticalAlign: -3,
      animationName: [rotate],
      animationDuration: '1s',
      animationIterationCount: 'infinite',
      animationTimingFunction: 'linear',
    },
  },
});
