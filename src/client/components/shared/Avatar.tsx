import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import colors from '../../configs/colors';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
type Props = {
  size: number;
  source: string | null;
  theme: ThemeName;
};

function Avatar(props: Props) {
  const { source, theme, size } = props;
  return (
    <div className={css(styles.container, theme === 'dark' && styles.dark)}>
      {source ? (
        <img
          className={css(styles.avatar)}
          src={source}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M13.125 13.563c2.423-3.635 2.831-10.938-2.623-10.938-5.454 0-5.05 7.303-2.627 10.938-2.423 0-5.25 2.389-5.25 4.812h15.75c.004-2.423-2.827-4.813-5.25-4.813z"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

export default withThemeName(Avatar);

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    stroke: colors.text.light,
    ':hover': {
      backgroundColor: colors.gray[200],
    },
  },
  avatar: {
    height: '100%',
    width: '100%',
    margin: 0,
    display: 'block',
  },
  dark: {
    stroke: colors.text.dark,
    ':hover': {
      backgroundColor: colors.gray[600],
    },
  },
});
