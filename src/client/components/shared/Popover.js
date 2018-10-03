/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import colors from '../../configs/colors';

const { PureComponent, Children, cloneElement } = React;

type Props = {
  children: React.Node,
  content: React.Node,
  theme: ThemeName,
};

type State = {
  visible: boolean,
};

class Popover extends PureComponent<Props, State> {
  state = {
    visible: false,
  };

  componentDidMount() {
    document.addEventListener('click', this._handleDocumentClick);
    document.addEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  _handleDocumentContextMenu = () => {
    if (this.state.visible) {
      this._hidePopover();
    }
  };

  _handleDocumentClick = (e: any) => {
    if (
      this.state.visible &&
      (e.target === this._anchor ||
        e.target === this._popover ||
        (this._popover && this._popover.contains(e.target)))
    ) {
      return;
    }

    this._hidePopover();
  };

  _togglePopover = () => {
    if (!this.state.visible) {
      const popover = (this._popover && this._popover.getBoundingClientRect()) || {};
      const anchor = (this._anchor && this._anchor.getBoundingClientRect()) || {};
      const diff = (popover.width - 10) / 2 - anchor.left;

      if (this._popover && this._arrow) {
        if (diff > 0) {
          this._popover.style.left = `${diff + 5}px`;
          this._arrow.style.left = `${anchor.left - anchor.width / 2 + 10}px`;
        } else {
          this._popover.style.left = '5px';
          this._arrow.style.left = '50%';
        }
      }
    }

    this.setState(state => ({ visible: !state.visible }));
  };

  _hidePopover = () => this.setState({ visible: false });

  _setRef = (c: HTMLElement) => (this._anchor = c);

  _anchor: ?HTMLElement;
  _arrow: ?HTMLElement;
  _popover: ?HTMLElement;

  render() {
    const { children, content, theme } = this.props;

    return (
      <div className={css(styles.container)}>
        {cloneElement(Children.only(children), {
          ref: this._setRef,
          onClick: this._togglePopover,
        })}
        <div
          ref={c => (this._popover = c)}
          className={css(
            styles.popover,
            theme === 'dark' ? styles.popoverDark : styles.popoverLight,
            this.state.visible ? styles.visible : styles.hidden
          )}>
          <span
            ref={c => (this._arrow = c)}
            className={css(styles.arrow, theme === 'dark' ? styles.arrowDark : styles.arrowLight)}
          />
          {content}
        </div>
      </div>
    );
  }
}

export default withThemeName(Popover);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'inherit',
  },

  popover: {
    position: 'absolute',
    top: '100%',
    margin: 12,
    width: '18em',
    borderRadius: 3,
    zIndex: 99,
    backgroundColor: 'inherit',
    color: 'inherit',
    transition: 'transform .2s, opacity .2s',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.16), 0 0 3px rgba(0, 0, 0, 0.08)',
  },

  popoverLight: {
    backgroundColor: colors.content.light,
    border: 0,
  },

  popoverDark: {
    backgroundColor: colors.content.dark,
    border: `1px solid ${colors.ayu.mirage.border}`,
  },

  arrow: {
    position: 'absolute',
    height: 16,
    width: 16,
    top: -9,
    transform: 'translateX(-50%) rotate(45deg)',
    backgroundColor: 'inherit',
    borderTopLeftRadius: 4,
    boxShadow: '-.5px -.5px 0 rgba(0, 0, 0, .12)',
  },

  arrowLight: {
    border: 0,
  },

  arrowDark: {
    borderStyle: 'solid',
    borderWidth: '1px 0 0 1px',
    borderColor: colors.ayu.mirage.border,
  },

  visible: {
    opacity: 1,
    transform: 'translateX(-50%) translateY(0)',
  },

  hidden: {
    opacity: 0,
    pointerEvents: 'none',
    transform: 'translateX(-50%) translateY(-4px)',
  },
});
