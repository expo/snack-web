import * as React from 'react';
import classnames from 'classnames';
import { StyleSheet, css } from 'aphrodite';
import colors from '../../configs/colors';
import { c } from '../ColorsProvider';
import usePreferences from '../Preferences/usePreferences';

type Props<T extends string> = {
  options: Array<{
    label: string;
    value: T;
  }>;
  label?: string;
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

export default function ToggleButtons<T extends string>(props: Props<T>) {
  const [prefs] = usePreferences();
  const light = prefs.theme !== 'dark';

  return (
    <span
      className={classnames(
        css(styles.buttons, props.disabled && styles.disabled),
        props.className
      )}>
      {props.label ? <span className={css(styles.label)}>{props.label}</span> : null}
      {props.options.map(o => (
        <button
          key={o.value}
          className={css(
            styles.button,
            o.value === props.value
              ? props.disabled
                ? light
                  ? styles.activeDisabledLight
                  : styles.activeDisabled
                : styles.active
              : undefined
          )}
          onClick={() => props.onValueChange(o.value)}>
          {o.label}
        </button>
      ))}
    </span>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
    cursor: 'not-allowed',
  },

  label: {
    flex: 1,
    margin: '0 .5em',
  },

  buttons: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    margin: '0 .5em',
    borderRadius: 10,
  },

  button: {
    appearance: 'none',
    outline: 0,
    height: 20,
    margin: 0,
    border: `1px solid ${colors.border}`,
    backgroundColor: c('content'),
    color: c('text'),
    lineHeight: 1,

    ':first-of-type': {
      borderRightWidth: 0,
      borderRadius: '10px 0 0 10px',
      padding: '0 .5em 0 1em',
    },

    ':last-of-type': {
      borderLeftWidth: 0,
      borderRadius: '0 10px 10px 0',
      padding: '0 1em 0 .5em',
    },
  },

  active: {
    backgroundColor: colors.primary,
    color: '#fff',
  },

  activeDisabled: {
    backgroundColor: '#999',
    color: '#fff',
  },

  activeDisabledLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
