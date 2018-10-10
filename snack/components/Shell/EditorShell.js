/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import AnimatedLogo from '../shared/AnimatedLogo';

type Props = {
  theme: ThemeName,
};

function EditorShell({ children, theme }: Props) {
  return (
    <div className={css(styles.container)}>
      <div className={css(styles.logo)}>
        <AnimatedLogo />
      </div>
    </div>
  );
}

export default withThemeName(EditorShell);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    transform: 'scale(0.4)',
    opacity: 0.2,
  },
});
