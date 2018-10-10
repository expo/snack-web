/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';

type Props = {
  value: string,
  readOnly?: boolean,
  onChangeText: Function,
  after?: React.Node,
  className?: string,
};

type State = {
  width: number,
};

export default class EditableField extends React.PureComponent<Props, State> {
  state = {
    width: 0,
  };

  componentDidMount() {
    this._adjustWidth();
  }

  componentDidUpdate(nextProps: Props) {
    if (nextProps.value !== this.props.value) {
      this._adjustWidth();
    }
  }

  _adjustWidth = () => {
    setTimeout(() => {
      const size = this._phantom.getBoundingClientRect();
      this.setState({
        width: size.width,
      });
    }, 0);
  };

  _handleChangeText = (e: any) => this.props.onChangeText(e.target.value);

  _phantom: any;

  render() {
    return (
      <div className={css(styles.container)}>
        <span
          ref={c => (this._phantom = c)}
          className={classnames(css(styles.field, styles.phantom), this.props.className)}>
          {this.props.value}
        </span>
        {this.state.width ? (
          <input
            readOnly={this.props.readOnly}
            value={this.props.value}
            onChange={this._handleChangeText}
            className={classnames(
              css(styles.field, !this.props.readOnly && styles.editable),
              this.props.className
            )}
            style={{ width: this.state.width }}
          />
        ) : (
          <span className={classnames(css(styles.field), this.props.className)}>
            {this.props.value}
          </span>
        )}
        {this.props.after}
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    margin: '0 .5em',
    position: 'relative',
  },

  field: {
    display: 'inline-block',
    appearance: 'none',
    outline: 0,
    margin: 0,
    padding: '.25em .5em',
    borderRadius: 3,
    border: '1px solid transparent',
    transition: 'border .2s',
    maxWidth: '100%',
  },

  editable: {
    ':focus': {
      border: '1px solid rgba(0, 0, 0, .24)',
    },
  },

  phantom: {
    position: 'absolute',
    left: 0,
    maxWidth: '100%',
    display: 'inline-block',
    pointerEvents: 'none',
    whiteSpace: 'pre',
    overflow: 'hidden',
    opacity: 0,
  },
});
