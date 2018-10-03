/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

type Props = {
  onClick: Function,
  children?: any,
};

export default class FileListPaneButton extends React.PureComponent<Props, void> {
  render() {
    return (
      <button {...this.props} className={css(styles.button)}>
        <svg className={css(styles.icon)} viewBox="0 0 16 16">
          {this.props.children}
        </svg>
      </button>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    appearance: 'none',
    background: 'transparent',
    border: 0,
    margin: 0,
    outline: 0,
  },
  icon: {
    fill: 'currentColor',
    height: 16,
    width: 16,
    verticalAlign: -3,
  },
});
