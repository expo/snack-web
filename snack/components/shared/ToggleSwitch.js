/* @flow */

import * as React from 'react';
import classnames from 'classnames';
import { StyleSheet, css } from 'aphrodite';

import colors from '../../configs/colors';

type Props = {
  light?: boolean,
  checked: boolean,
  label: string,
  onChange: Function,
  className?: string,
};

export default function ToggleSwitch(props: Props) {
  return (
    <label className={classnames(css(styles.container), props.className)}>
      <span className={css(styles.label)}>{props.label}</span>
      <span
        className={css(
          styles.switch,
          props.checked ? styles.active : styles.inactive,
          props.light ? styles.light : styles.dark,
          props.light
            ? props.checked ? styles.lightActive : styles.lightInactive
            : props.checked ? styles.darkActive : styles.darkInactive
        )}
      />
      <input
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange}
        className={css(styles.check)}
      />
    </label>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    margin: '0 .5em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  switch: {
    display: 'inline-block',
    verticalAlign: -4,
    width: 36,
    height: 20,
    borderRadius: 12,

    ':before': {
      content: '""',
      display: 'inline-block',
      height: 14,
      width: 14,
      borderRadius: 7,
      margin: 2,
      transition: '.2s',
      transform: 'translateX(0)',
    },
  },
  inactive: {
    ':before': {
      transform: 'translateX(0)',
    },
  },
  active: {
    ':before': {
      transform: 'translateX(16px)',
    },
  },
  dark: {
    border: `1px solid ${colors.border}`,
  },
  darkInactive: {
    ':before': {
      backgroundColor: 'currentColor',
    },
  },
  darkActive: {
    ':before': {
      backgroundColor: colors.primary,
    },
  },
  light: {
    border: '1px solid rgba(255, 255, 255, .2)',
  },
  lightInactive: {
    ':before': {
      backgroundColor: 'rgba(255, 255, 255, .5)',
    },
  },
  lightActive: {
    ':before': {
      backgroundColor: colors.content.light,
    },
  },
  check: {
    display: 'none',
  },
  label: {
    flex: 1,
    padding: '0 .5em',
    fontWeight: 'normal',
  },
});
