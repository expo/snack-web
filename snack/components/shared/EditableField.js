/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import colors from '../../configs/colors';

type Props = {
  value: string,
  onSubmitText: (value: string) => Promise<void>,
  className?: string,
  theme: ThemeName,
};

type State = {
  value: string,
  focused: boolean,
};

const RETURN_KEYCODE = 13;
const ESCAPE_KEYCODE = 27;

class EditableField extends React.Component<Props, State> {
  state = {
    value: this.props.value || '',
    focused: false,
  };

  componentWillReceiveProps(nextProps: Props) {
    if (this.state.value !== nextProps.value && !this.state.focused) {
      this.setState({
        value: nextProps.value || '',
      });
    }
  }

  _handleChangeText = (e: *) => this.setState({ value: e.target.value });

  _handleFocus = (e: *) => {
    e.target.select();
    this.setState({ focused: true });
  };

  _handleBlur = async () => {
    await this.props.onSubmitText(this.state.value);
    this.setState({ focused: false });
  };

  _handleKeyDown = (e: *) => {
    if (e.keyCode === RETURN_KEYCODE || e.keyCode === ESCAPE_KEYCODE) {
      e.target.blur();
    }
  };

  render() {
    return (
      <div className={css(styles.container)}>
        <div className={classnames(css(styles.field, styles.phantom), this.props.className)}>
          {this.state.value.replace(/\n/g, '')}&nbsp;
        </div>
        <input
          onFocus={this._handleFocus}
          onBlur={this._handleBlur}
          onKeyDown={this._handleKeyDown}
          value={this.state.value}
          onChange={this._handleChangeText}
          className={classnames(
            css(
              styles.field,
              styles.editable,
              this.props.theme === 'dark' ? styles.editableDark : styles.editableLight
            ),
            this.props.className
          )}
        />
      </div>
    );
  }
}

export default withThemeName(EditableField);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: '100%',
    position: 'relative',
  },

  field: {
    display: 'inline-block',
    margin: 0,
    padding: '1px 6px',
  },

  editable: {
    position: 'absolute',
    appearance: 'none',
    background: 'none',
    outline: 0,
    border: 0,
    left: 0,
    width: '100%',
    borderRadius: 0,

    ':focus': {
      boxShadow: `inset 0 0 0 1px ${colors.primary}`,
    },

    ':hover:focus': {
      boxShadow: `inset 0 0 0 1px ${colors.primary}`,
    },
  },

  editableLight: {
    ':hover': {
      boxShadow: `inset 0 0 0 1px rgba(0, 0, 0, .16)`,
    },
  },

  editableDark: {
    ':hover': {
      boxShadow: `inset 0 0 0 1px rgba(255, 255, 255, .16)`,
    },
  },

  phantom: {
    display: 'inline-block',
    maxWidth: '100%',
    pointerEvents: 'none',
    whiteSpace: 'pre',
    overflow: 'hidden',
    opacity: 0,
  },
});
