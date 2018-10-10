/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import colors from '../../configs/colors';

type Props = {
  type?: 'loading' | 'error' | null,
  children?: React.Node,
  theme: ThemeName,
};

function EmbeddedFooterShell({ type, children, theme }: Props) {
  return (
    <div className={css(styles.footer, type === 'loading' ? styles.footerLoading : null)}>
      {children}
    </div>
  );
}

export default withThemeName(EmbeddedFooterShell);

const styles = StyleSheet.create({
  footer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    color: '#999',
    borderTop: `1px solid ${colors.border}`,
    transition: 'background .2s',
    padding: '0 4px',
    fontSize: 12,
    height: 26,
  },

  footerLoading: {
    backgroundColor: colors.primary,
    color: 'rgba(255, 255, 255, .7)',
  },
});
