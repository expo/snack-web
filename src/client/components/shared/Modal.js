/* @flow */

import * as React from 'react';
import ReactDOM from 'react-dom';
import { StyleSheet, css } from 'aphrodite';

type Props = {
  visible: boolean,
  children?: React.Node,
  onDismiss?: Function,
};

type State = {
  rendered: boolean,
};

export default class Modal extends React.PureComponent<Props, State> {
  state = {
    rendered: this.props.visible,
  };

  componentDidMount() {
    /* $FlowFixMe */
    document.body.appendChild(this._container);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.visible !== this.props.visible) {
      clearTimeout(this._timer);
      if (nextProps.visible) {
        this.setState({ rendered: true });
      } else {
        this._timer = setTimeout(() => this.setState({ rendered: false }), 200);
      }
    }
  }

  componentWillUnmount() {
    /* $FlowFixMe */
    document.body.removeChild(this._container);
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  _container = document.createElement('div');
  _timer: any;
  _content: any;

  _handleDismiss = (e: any) => {
    if (this._content && this._content !== e.target && this._content.contains(e.target)) {
      return;
    }

    this.props.onDismiss && this.props.onDismiss();
  };

  _handleKeyDown = (e: any) => {
    if (e.keyCode === 27 && this.props.visible) {
      // Esc was pressed
      e.preventDefault();
      this.props.onDismiss && this.props.onDismiss();
    }
  };

  render() {
    return ReactDOM.createPortal(
      <div
        className={css(styles.modal, this.props.visible ? styles.visible : styles.hidden)}
        onClick={this._handleDismiss}>
        <div ref={c => (this._content = c)} className={css(styles.content)}>
          {this.state.rendered ? this.props.children : null}
        </div>
      </div>,
      this._container
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24, 29, 37, 0.8)',
    color: '#fff',
    zIndex: 999,
    transitionDuration: '200ms',
    '-webkit-font-smoothing': 'antialiased',
  },
  content: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
});
