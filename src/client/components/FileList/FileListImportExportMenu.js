/* @flow */

import * as React from 'react';
import ReactDOM from 'react-dom';
import FileListPaneButton from './FileListPaneButton';
import ContextMenu from '../shared/ContextMenu';
import type { SaveStatus } from '../../types';

type Props = {
  onImportFilesClick: () => mixed,
  onImportRepoClick: () => mixed,
  onExportClick: () => mixed,
  hasSnackId: boolean,
  saveStatus: SaveStatus,
};

type State = {
  menu: ?{
    pageX: number,
    pageY: number,
  },
};

export default class FileListImportExportMenu extends React.PureComponent<Props, State> {
  state: State = {
    menu: null,
  };

  componentDidMount() {
    document.addEventListener('click', this._handleDocumentClick);
    document.addEventListener('contextmenu', this._hideContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('contextmenu', this._hideContextMenu);
  }

  _hideContextMenu = () => this.setState({ menu: null });

  _showContextMenu = (e: MouseEvent) => {
    /* $FlowFixMe */
    const { bottom, right } = e.currentTarget.getBoundingClientRect();
    this.setState({
      menu: {
        pageX: right - 8,
        pageY: bottom - 8,
      },
    });
  };

  _handleDocumentClick = (e: MouseEvent) => {
    if (this.state.menu) {
      if (this._button && (e.target !== this._button && !this._button.contains(e.target))) {
        this._hideContextMenu();
      }
    }
  };

  _toggleContextMenu = (e: MouseEvent) => {
    if (this.state.menu) {
      this._hideContextMenu();
    } else {
      this._showContextMenu(e);
    }
  };

  _menu: any;
  _button: any;

  render() {
    const isSaved =
      this.props.saveStatus === 'published' || this.props.saveStatus === 'saved-draft';

    return (
      <div>
        <FileListPaneButton
          ref={c => (this._button = ReactDOM.findDOMNode(c))}
          onClick={this._toggleContextMenu}>
          <g fillOpacity="0.7">
            <circle cy="3" cx="8" r="1.5" />
            <circle cy="8" cx="8" r="1.5" />
            <circle cy="13" cx="8" r="1.5" />
          </g>
        </FileListPaneButton>
        <ContextMenu
          ref={c => (this._menu = ReactDOM.findDOMNode(c))}
          visible={Boolean(this.state.menu)}
          position={this.state.menu}
          actions={[
            {
              label: 'Import files',
              handler: this.props.onImportFilesClick,
            },
            {
              label: 'Import git repository',
              handler: this.props.onImportRepoClick,
            },
            {
              label: 'Export project',
              handler: this.props.onExportClick,
              disabled: !(isSaved && this.props.hasSnackId),
            },
          ]}
          onHide={this._hideContextMenu}
        />
      </div>
    );
  }
}
