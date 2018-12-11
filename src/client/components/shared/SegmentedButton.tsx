import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import colors from '../../configs/colors';

type Segment<T> = {
  id: T;
  text: string;
};

type Props<T> = {
  selectedId: T;
  onSelect: (id: T) => void;
  onClick?: () => void;
  segments: Array<Segment<T>>;
  className?: string;
  theme: ThemeName;
};

function SegmentedButton<T extends string>({ selectedId, onSelect, segments, theme }: Props<T>) {
  return (
    <div className={css(styles.container)}>
      {segments.map(({ id, text }) => (
        <button
          onClick={e => {
            e.preventDefault();
            onSelect(id);
          }}
          className={css(
            styles.button,
            selectedId === id ? (theme === 'dark' ? styles.accentDark : styles.accentLight) : null
          )}
          key={id}>
          <span>{text}</span>
        </button>
      ))}
    </div>
  );
}

export default withThemeName(SegmentedButton);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    boxShadow: `inset 0 0 0 1px ${colors.border}`,
    borderRadius: 3,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    cursor: 'pointer',
    outline: 0,
    border: 0,
    padding: '.5em 1em',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    transitionDuration: '170ms',
    transitionProperty: 'color, background',
    transitionTimingFunction: 'linear',
    appearance: 'none',
    backgroundColor: 'transparent',

    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, .08)',
    },
  },

  accentLight: {
    color: '#fff',
    backgroundColor: colors.accent.light,

    ':hover': {
      backgroundColor: colors.accent.light,
    },
  },

  accentDark: {
    color: '#000',
    backgroundColor: colors.accent.dark,

    ':hover': {
      backgroundColor: colors.accent.dark,
    },
  },
});
