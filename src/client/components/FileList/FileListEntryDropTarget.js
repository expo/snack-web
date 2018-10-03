/* @flow */

import * as React from 'react';
import ReactDOM from 'react-dom';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import { lastDraggedEntry } from './FileListEntryBase';
import { getUniquePath } from '../../utils/fileUtilities';
import dragEventIncludes from '../../utils/dragEventIncludes';
import type { FileSystemEntry } from '../../types';

type Props = {|
  entry?: FileSystemEntry,
  rest: FileSystemEntry[],
  onExpand?: (path: string, expand?: boolean) => mixed,
  onRename: (oldPath: string, newPath: string) => mixed,
  className?: string,
  theme: ThemeName,
  children?: any,
|};

class FileListEntryDropTarget extends React.PureComponent<Props, void> {
  componentDidMount() {
    // We don't use react's event system since we need to stop the events from bubbling up
    this._container.addEventListener('dragover', this._handleDragOver);
    this._container.addEventListener('dragleave', this._handleDragLeave);
    this._container.addEventListener('dragend', this._handleDragLeave);
    this._container.addEventListener('drop', this._handleDrop);
  }

  componentWillUnmount() {
    this._container.removeEventListener('dragover', this._handleDragOver);
    this._container.removeEventListener('dragleave', this._handleDragLeave);
    this._container.removeEventListener('dragend', this._handleDragLeave);
    this._container.removeEventListener('drop', this._handleDrop);
  }

  _getParentPath = (path: string) => (path.includes('/') ? path.replace(/\/[^/]+$/, '') : null);

  _isDirectChild = (path: string) => {
    if (this.props.entry && this.props.entry.item.path === path) {
      return true;
    }

    const parent = this._getParentPath(path);

    if (this.props.entry && parent) {
      return this.props.entry.item.path === parent;
    }

    return this.props.entry == null && parent == null;
  };

  _handleDragLeave = (e: *) => {
    e.currentTarget.style.backgroundColor = null;
    clearTimeout(this._dragTimer);
    this._dragTimer = null;
  };

  _handleDragOver = (e: *) => {
    const entry = lastDraggedEntry;

    if (
      !dragEventIncludes(e, 'application/json') ||
      (this.props.entry && this.props.entry.item.type !== 'folder') ||
      !entry
    ) {
      return;
    }

    if (entry.item.type !== 'file' && entry.item.type !== 'folder') {
      return;
    }

    e.stopPropagation();

    if (this._isDirectChild(entry.item.path)) {
      return;
    }

    e.preventDefault();
    e.currentTarget.style.backgroundColor =
      this.props.theme === 'dark' ? 'rgba(255, 255, 255, .1)' : 'rgba(0, 0, 0, .1)';

    if (this._dragTimer) {
      return;
    }

    this._dragTimer = setTimeout(() => {
      if (this.props.entry && !this.props.entry.state.isExpanded && this.props.onExpand) {
        this.props.onExpand(this.props.entry.item.path);
      }
    }, 500);
  };

  _dragTimer: any;

  _handleDrop = (e: *) => {
    e.currentTarget.style.backgroundColor = null;

    if (
      !dragEventIncludes(e, 'application/json') ||
      (this.props.entry && this.props.entry.item.type !== 'folder')
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    try {
      const data = e.dataTransfer.getData('application/json');
      const entry = JSON.parse(data);

      if (
        (entry.item.type !== 'file' && entry.item.type !== 'folder') ||
        this._isDirectChild(entry.item.path)
      ) {
        return;
      }

      const name = entry.item.path.split('/').pop();

      this.props.onRename(
        entry.item.path,
        getUniquePath(
          this.props.rest.map(e => e.item.path),
          this.props.entry ? this.props.entry.item.path + '/' + name : name
        )
      );
    } catch (e) {
      // Something else other than a file/folder was dragged
    }
  };

  _container: any;

  render() {
    // eslint-disable-next-line no-unused-vars
    const { entry, rest, onExpand, onRename, theme, ...restProps } = this.props;

    return <div {...restProps} ref={c => (this._container = ReactDOM.findDOMNode(c))} />;
  }
}

export default withThemeName(FileListEntryDropTarget);
