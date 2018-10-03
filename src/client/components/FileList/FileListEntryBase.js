/* @flow */

import * as React from 'react';
import ReactDOM from 'react-dom';
import { StyleSheet, css } from 'aphrodite';
import FileListEntryDropTarget from './FileListEntryDropTarget';
import { isKeyCombo } from '../shared/KeybindingsManager';
import ContextMenu from '../shared/ContextMenu';
import type { Action } from '../shared/ContextMenu';
import type { FileSystemEntry } from '../../types';

type Props = {
  entry: FileSystemEntry,
  rest: Array<FileSystemEntry>,
  onOpen: (path: string) => mixed,
  onFocus: (path: string) => mixed,
  onRename: (oldPath: string, newPath: string) => mixed,
  onExpand?: (path: string, expand?: boolean) => mixed,
  renderMenuIcon: () => React.Node,
  renderItem: () => React.Node,
  renderTree?: () => React.Node,
  actions: Array<?Action>,
  draggable?: boolean,
  theme: ?string,
};

type State = {|
  menu: ?{
    pageX: number,
    pageY: number,
  },
  isHovered: boolean,
|};

export let lastDraggedEntry;

export default class FileListEntry extends React.Component<Props, State> {
  state = {
    menu: null,
    isHovered: false,
  };

  componentDidMount() {
    document.addEventListener('click', this._handleDocumentClick);
    document.addEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  _handleClick = (event: MouseEvent) => {
    /* $FlowFixMe */
    if (event.target.tagName === 'INPUT') {
      return;
    }

    this.props.onOpen(this.props.entry.item.path);
  };

  _handleMouseEnter = () =>
    this.setState({
      isHovered: true,
    });

  _handleMouseLeave = () =>
    this.setState({
      isHovered: false,
    });

  _handleMouseDown = () => (this._click = true);

  _handleFocus = () => {
    if (this._click) {
      // The focus was triggered by a click event
      // Ignore it to avoid double handling
      this._click = false;
      return;
    }

    this.props.onFocus(this.props.entry.item.path);
  };

  _handleKeyDown = (event: KeyboardEvent) => {
    /* $FlowFixMe */
    if (event.target.tagName === 'INPUT') {
      return;
    }

    const bindings = this.props.actions.filter(
      action => (action && action.combo ? isKeyCombo(event, action.combo) : false)
    );

    if (bindings.length) {
      event.preventDefault();

      bindings.forEach(binding => binding && binding.handler());
    }
  };

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
    } else if (this._more && (e.target === this._more || this._more.contains(e.target))) {
      if (this.state.menu) {
        this._hideContextMenu();
      } else {
        this._showContextMenu(e);
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

  _handleDragStart = (e: *) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(this.props.entry));
    lastDraggedEntry = this.props.entry;
  };

  _handleDragEnd = () => {
    lastDraggedEntry = null;
  };

  _click: boolean = false;
  _item: any;
  _more: any;
  _menu: any;

  render() {
    const { entry, rest, draggable = true, onRename, onExpand, theme, actions } = this.props;
    const { menu, isHovered } = this.state;

    return (
      <FileListEntryDropTarget entry={entry} rest={rest} onRename={onRename} onExpand={onExpand}>
        <div
          ref={c => (this._item = ReactDOM.findDOMNode(c))}
          draggable={draggable}
          onDragStart={this._handleDragStart}
          onDragEnd={this._handleDragEnd}
          tabIndex={0}
          className={css(
            styles.entry,
            entry.state.isSelected || menu ? styles.active : styles.inactive
          )}
          onClick={this._handleClick}
          onMouseEnter={this._handleMouseEnter}
          onMouseLeave={this._handleMouseLeave}
          onMouseDown={this._handleMouseDown}
          onFocus={this._handleFocus}
          onKeyDown={this._handleKeyDown}>
          {this.props.renderItem()}
        </div>
        <div
          className={css(
            styles.highlight,
            theme === 'dark' ? styles.highlightDark : styles.highlightLight,
            entry.state.isSelected ? styles.highlightActive : null
          )}
        />
        <ContextMenu
          ref={c => (this._menu = ReactDOM.findDOMNode(c))}
          visible={Boolean(menu)}
          position={menu}
          actions={actions}
          onHide={this._hideContextMenu}
        />
        <button
          ref={c => (this._more = ReactDOM.findDOMNode(c))}
          tabIndex={-1}
          className={css(
            styles.more,
            isHovered || menu ? styles.moreVisible : styles.moreInvisible
          )}>
          {this.props.renderMenuIcon()}
        </button>
        {this.props.renderTree && this.props.renderTree()}
      </FileListEntryDropTarget>
    );
  }
}

const styles = StyleSheet.create({
  entry: {
    position: 'relative',
    display: 'inline-block',
    outline: 0,
    padding: '4px 16px',
    width: '100%',
    cursor: 'pointer',
    zIndex: 1,
    whiteSpace: 'nowrap',
  },

  highlight: {
    content: '""',
    display: 'inline-block',
    height: 30,
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },

  highlightLight: {
    backgroundColor: 'rgba(0, 0, 0, .04)',
  },

  highlightDark: {
    backgroundColor: 'rgba(255, 255, 255, .04)',
  },

  highlightActive: {
    opacity: 1,
  },

  more: {
    position: 'absolute',
    left: -8,
    border: 0,
    outline: 0,
    background: 'none',
    height: 30,
    zIndex: 2,
    padding: '7px 12px',
    textAlign: 'right',

    ':hover': {
      opacity: 1,
    },
  },

  moreInvisible: {
    opacity: 0,
  },

  moreVisible: {
    opacity: 1,
  },

  icon: {
    fill: 'currentColor',
    height: 16,
    width: 16,
  },
});
