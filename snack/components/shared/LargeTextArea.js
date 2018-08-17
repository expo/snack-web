/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import Textarea from 'react-textarea-autosize';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import colors from '../../configs/colors';

type Props = {
  value: ?string,
  name?: string,
  theme: ThemeName,
  minRows?: number,
  default?: string,
  onChange: (e: *) => mixed,
};

function LargeTextArea(props: Props) {
  return (
    <Textarea
      className={css(styles.input, props.theme === 'light' ? styles.inputLight : styles.inputDark)}
      name={props.name}
      minRows={props.minRows}
      value={props.value}
      onChange={props.onChange}
      placeholder={props.default}
    />
  );
}

export default withThemeName(LargeTextArea);

const styles = StyleSheet.create({
  input: {
    outline: 0,
    fontSize: 16,
    borderRadius: 3,
    padding: '12px 14px 12px 14px',
    lineHeight: '22px',
    border: `1px solid rgba(36, 44, 58, 0.1)`,
    width: '100%',
    ':focus': {
      borderColor: colors.primary,
    },
  },
  inputLight: {
    backgroundColor: '#FFFFFF',
  },
  inputDark: {
    backgroundColor: 'rgba(0, 0, 0, .16)',
  },
});
