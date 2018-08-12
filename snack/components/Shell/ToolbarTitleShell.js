/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import withThemeName, { type ThemeName } from '../theming/withThemeName';

type Props = {
  children?: React.Node,
  theme: ThemeName,
};

function ToolbarTitleShell({ children, theme }: Props) {
  return (
    <div className={css(styles.left)}>
      <img
        src={
          theme === 'dark'
            ? require('../../assets/snack-icon-dark.svg')
            : require('../../assets/snack-icon.svg')
        }
        alt="Snack"
        className={css(styles.logo)}
      />
      {children}
    </div>
  );
}

export default withThemeName(ToolbarTitleShell);

const styles = StyleSheet.create({
  left: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flex: 1,
  },

  logo: {
    width: 36,
    height: 'auto',
    margin: '0 .5em 0 .75em',
  },
});
