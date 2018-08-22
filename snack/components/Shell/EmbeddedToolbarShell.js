/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import colors from '../../configs/colors';

type Props = {
  children?: React.Node,
  theme: ThemeName,
};

function EmbeddedToolbarShell({ children, theme }: Props) {
  return (
    <div
      className={css(styles.toolbar, theme === 'dark' ? styles.toolbarDark : styles.toolbarLight)}>
      {children}
    </div>
  );
}

export default withThemeName(EmbeddedToolbarShell);

const styles = StyleSheet.create({
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${colors.border}`,
    padding: 4,
    height: 48,
  },

  toolbarLight: {
    backgroundColor: colors.content.light,
    color: colors.text.light,
  },

  toolbarDark: {
    backgroundColor: colors.content.dark,
    color: colors.text.dark,
  },
});
