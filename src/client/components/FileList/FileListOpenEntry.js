/* @flow */

import * as React from 'react';
import ReactDOM from 'react-dom';
import { StyleSheet, css } from 'aphrodite';
import FileListEntryIcon from './FileListEntryIcon';
import ContextMenu from '../shared/ContextMenu';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import type { TextFileEntry, AssetFileEntry } from '../../types';

type Props = {|
  entry: TextFileEntry | AssetFileEntry,
  onOpen: () => mixed,
  onClose: () => mixed,
  onCloseOthers: () => mixed,
  onCloseAll: () => mixed,
  theme: ThemeName,
|};

type State = {|
  isHovered: boolean,
  menu: ?{
    pageX: number,
    pageY: number,
  },
|};

class FileListOpenEntry extends React.PureComponent<Props, State> {
  state: State = {
    isHovered: false,
    menu: null,
  };

  componentDidMount() {
    document.addEventListener('click', this._handleDocumentClick);
    document.addEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  _hideContextMenu = () => this.setState({ menu: null });

  _showContextMenu = (e: MouseEvent) => {
    this.setState({
      menu: {
        pageX: e.pageX,
        pageY: e.pageY,
      },
    });
  };

  _handleDocumentClick = (e: MouseEvent) => {
    if (this.state.menu) {
      if (this._menu && e.target !== this._menu && !this._menu.contains(e.target)) {
        this._hideContextMenu();
      }
    }
  };

  _handleDocumentContextMenu = (e: MouseEvent) => {
    if (e.target === this._item || this._item.contains(e.target)) {
      e.preventDefault();
      this._showContextMenu(e);
    } else if (this.state.menu) {
      this._hideContextMenu();
    }
  };

  _handleMouseEnter = () =>
    this.setState({
      isHovered: true,
    });

  _handleMouseLeave = () =>
    this.setState({
      isHovered: false,
    });

  _menu: any;
  _item: any;

  render() {
    const { entry, theme } = this.props;
    const displayName = entry.item.path.split('/').pop();

    return (
      <li
        ref={c => (this._item = ReactDOM.findDOMNode(c))}
        tabIndex={-1}
        className={css(
          styles.item,
          entry.state.isFocused && (theme === 'dark' ? styles.focusedDark : styles.focusedLight)
        )}
        onMouseEnter={this._handleMouseEnter}
        onMouseLeave={this._handleMouseLeave}>
        <button
          onClick={this.props.onClose}
          className={css(
            styles.close,
            this.state.isHovered ? styles.closeFocused : styles.closeBlurred
          )}>
          ×
        </button>
        <div onClick={this.props.onOpen}>
          <FileListEntryIcon entry={entry} />
          <span className={css(styles.label)}>{displayName}</span>
        </div>
        <ContextMenu
          ref={c => (this._menu = ReactDOM.findDOMNode(c))}
          visible={Boolean(this.state.menu)}
          position={this.state.menu}
          actions={[
            {
              label: 'Close',
              handler: this.props.onClose,
            },
            {
              label: 'Close Others',
              handler: this.props.onCloseOthers,
            },
            {
              label: 'Close All',
              handler: this.props.onCloseAll,
            },
          ]}
          onHide={this._hideContextMenu}
        />
      </li>
    );
  }
}

export default withThemeName(FileListOpenEntry);

const styles = StyleSheet.create({
  item: {
    paddingLeft: 24,
    cursor: 'pointer',
    outline: 0,
    whiteSpace: 'nowrap',
  },
  label: {
    display: 'inline-block',
    verticalAlign: -1,
    margin: 6,
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  focusedLight: {
    backgroundColor: 'rgba(0, 0, 0, .04)',
  },
  focusedDark: {
    backgroundColor: 'rgba(255, 255, 255, .04)',
  },
  close: {
    padding: '7px 8px',
    fontSize: '18px',
    border: 'none',
    appearance: 'none',
    position: 'absolute',
    left: 0,
    margin: '-3px 0 0 0',
    background: 'none',
    outline: 0,
  },
  closeFocused: {
    opacity: 1,
  },
  closeBlurred: {
    opacity: 0,
  },
});
