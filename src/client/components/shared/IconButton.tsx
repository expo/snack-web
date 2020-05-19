import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import colors from '../../configs/colors';
import { c } from '../ColorsProvider';

type Props = {
  type?: 'submit' | 'button';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  theme: ThemeName;
  title: string;
  label?: string;
  responsive?: boolean;
  children: React.ReactNode;
};

function IconButton({ title, label, responsive, children, theme, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={css(
        styles.button,
        theme === 'dark' ? styles.dark : styles.light,
        rest.disabled && styles.disabled
      )}>
      {children}
      {label ? (
        <span className={css(styles.label, responsive && styles.responsive)}>{label}</span>
      ) : null}
      <span className={css(styles.phantom)}>
        <span
          className={css(
            styles.tooltip,
            theme === 'dark' ? styles.tooltipDark : styles.tooltipLight
          )}>
          {title}
        </span>
      </span>
    </button>
  );
}

export default withThemeName(IconButton);

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    height: 40,
    minWidth: 40,
    margin: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    padding: 0,
    outline: 0,
    border: 0,
    borderRadius: 2,
    whiteSpace: 'nowrap',
    textDecoration: 'none',

    ':active': {
      opacity: 0.8,
    },

    ':hover': {
      cursor: 'pointer',
    },
  },

  dark: {
    fill: colors.text.dark,
    stroke: colors.text.dark,

    ':hover': {
      backgroundColor: colors.gray[600],
    },
  },

  light: {
    fill: colors.text.light,
    stroke: colors.text.light,

    ':hover': {
      backgroundColor: colors.gray[200],
    },
  },

  disabled: {
    cursor: 'not-allowed',
    pointerEvents: 'none',
    opacity: 0.3,
  },

  phantom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    zIndex: 1,

    ':hover': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  },

  tooltip: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: '50%',
    transform: 'translateX(-50%)',
    marginLeft: -2.5,
    borderRadius: 2,
    fontSize: 12,
    padding: '4px 8px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
  },

  tooltipLight: {
    backgroundColor: colors.accent.light,
    color: '#fff',

    ':before': {
      borderBottom: `5px solid ${colors.accent.light}`,
    },
  },

  tooltipDark: {
    backgroundColor: colors.accent.dark,
    color: '#000',

    ':before': {
      borderBottom: `5px solid ${colors.accent.dark}`,
    },
  },

  label: {
    margin: '0 12px',
    color: c('text'),
  },

  responsive: {
    '@media (max-width: 960px)': {
      display: 'none',
    },
  },
});
