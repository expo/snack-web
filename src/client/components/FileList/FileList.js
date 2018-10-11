/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import JSON5 from 'json5';
import { isModulePreloaded } from 'snack-sdk';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import ResizablePane from '../shared/ResizablePane';
import Toast from '../shared/Toast';
import SidebarShell from '../Shell/SidebarShell';
import FileListPane from './FileListPane';
import FileListOpenEntry from './FileListOpenEntry';
import FileListChildren from './FileListChildren';
import FileListEntryDropTarget from './FileListEntryDropTarget';
import FileListImportManager from './FileListImportManager';
import FileListImportExportMenu from './FileListImportExportMenu';
import FileListPaneButton from './FileListPaneButton';
import RepoImportManager from '../RepoImportManager';
import Segment from '../../utils/Segment';
import closeEntry from '../../actions/closeEntry';
import createNewEntry from '../../actions/createNewEntry';
import expandEntry from '../../actions/expandEntry';
import pasteEntry from '../../actions/pasteEntry';
import recursivelyCreateParents from '../../actions/recursivelyCreateParents';
import renameEntry from '../../actions/renameEntry';
import selectEntry from '../../actions/selectEntry';
import openEntry from '../../actions/openEntry';
import updateEntry from '../../actions/updateEntry';
import { isPackageJson, getUniquePath, isInsideFolder } from '../../utils/fileUtilities';
import type { SDKVersion } from '../../configs/sdk';
import type { FileSystemEntry, TextFileEntry, AssetFileEntry, SaveStatus } from '../../types';

type Props = {
  visible: boolean,
  onEntriesChange: (Array<FileSystemEntry>) => Promise<void>,
  onRemoveFile: (path: string) => mixed,
  onRenameFile: (oldPath: string, newPath: string) => mixed,
  entries: Array<FileSystemEntry>,
  uploadFileAsync: (file: File) => Promise<string>,
  onDownloadCode: () => Promise<void>,
  hasSnackId: boolean,
  saveStatus: SaveStatus,
  sdkVersion: SDKVersion,
  theme: ThemeName,
  preventRedirectWarning: () => void,
};

type State = {
  clipboard: Array<FileSystemEntry>,
  deleted: Array<{ id: number, path: string, entries: FileSystemEntry[] }>,
  openFilesPane: boolean,
  projectPane: boolean,
  isRepoManagerShown: boolean,
};

const AddIcon = () => (
  <g transform="translate(7.000000, 7.000000)">
    <circle fill="#4CAF50" cx="4.5" cy="4.5" r="4.5" />
    <rect fill="#FFFFFF" x="4" y="2" width="1" height="5" />
    <rect fill="#FFFFFF" x="2" y="4" width="5" height="1" />
  </g>
);

class FileList extends React.PureComponent<Props, State> {
  state: State = {
    clipboard: [],
    deleted: [],
    openFilesPane: true,
    projectPane: true,
    isRepoManagerShown: false,
  };

  _handleEntrySelect = (path: string) =>
    this.props.onEntriesChange(selectEntry(this.props.entries, path));

  _handleEntryOpen = (path: string) =>
    this.props.onEntriesChange(openEntry(this.props.entries, path));

  _handleEntryFocus = (path: string) =>
    this.props.onEntriesChange(openEntry(this.props.entries, path, true));

  _handleEntryExpand = (path: string, expand?: boolean) =>
    this.props.onEntriesChange(expandEntry(this.props.entries, path, expand));

  _handleEntryRename = (oldPath: string, newPath: string) => {
    if (oldPath !== newPath) {
      this.props.onRenameFile(oldPath, newPath);
    }

    this.props.onEntriesChange(renameEntry(this.props.entries, oldPath, newPath));
  };

  _restoreEntries = (entries: FileSystemEntry[]) =>
    this.props.onEntriesChange([
      ...this.props.entries,
      ...entries.map(e =>
        updateEntry(e, {
          item: {
            path: getUniquePath(this.props.entries.map(it => it.item.path), e.item.path),
          },
        })
      ),
    ]);

  _handleDismissDelete = (id: number) =>
    this.setState(state => ({
      deleted: state.deleted.filter(g => g.id !== id),
    }));

  _handleEntryClose = (path: string) =>
    this.props.onEntriesChange(
      this.props.entries.map(e => {
        if (e.item.path === path) {
          return closeEntry(e);
        }
        return e;
      })
    );

  _handleEntryCloseOthers = (path: string) =>
    this.props.onEntriesChange(
      this.props.entries.map(e => {
        if (e.item.path !== path) {
          return closeEntry(e);
        }
        return e;
      })
    );

  _handleEntryCloseAll = () =>
    this.props.onEntriesChange(this.props.entries.map(e => closeEntry(e)));

  _handleEntryDelete = (path: string) => {
    const entry = this.props.entries.find(e => e.item.path === path);
    const entries = [];

    this.props.onEntriesChange(
      this.props.entries.filter(e => {
        const remove = e.item.path === path || isInsideFolder(e.item.path, path);
        if (remove) {
          entries.push(e);
          this.props.onRemoveFile(path);
        }
        return !remove;
      })
    );

    this.setState(state => ({
      deleted: [
        ...state.deleted,
        {
          id: this._currentDeleteID++,
          path: entry ? entry.item.path : 'Item',
          entries,
        },
      ],
    }));
  };

  _currentDeleteID: number = 0;

  _handleEntryImport = (entry: TextFileEntry | AssetFileEntry) => {
    let entries;

    if (isPackageJson(entry.item.path)) {
      // Merge dependencies from package.json file
      entries = this.props.entries.map(e => {
        if (isPackageJson(e.item.path)) {
          try {
            // Use JSON5 for a more forgiving approach, e.g. trailing commas
            // $FlowFixMe
            const previous = JSON5.parse(e.item.content);
            // $FlowFixMe
            const next = JSON5.parse(entry.item.content);

            // $FlowFixMe
            return {
              ...e,
              item: {
                ...e.item,
                content: JSON.stringify(
                  {
                    ...previous,
                    dependencies: {
                      ...previous.dependencies,
                      ...Object.keys(next.dependencies).reduce((acc, name) => {
                        if (!isModulePreloaded(name, this.props.sdkVersion)) {
                          acc[name] = next.dependencies[name];
                        }

                        return acc;
                      }, {}),
                    },
                  },
                  null,
                  2
                ),
              },
            };
          } catch (err) {
            // Do nothing
          }
        }

        return e;
      });
    } else {
      const parents = recursivelyCreateParents(this.props.entries, entry.item.path);

      entries = [...this.props.entries, ...parents];
      entries.push(
        updateEntry(entry, {
          item: {
            path: getUniquePath(entries.map(e => e.item.path), entry.item.path),
          },
        })
      );
    }

    this.props.onEntriesChange(entries);
  };

  _handleEntryPaste = (path: ?string, e: FileSystemEntry) =>
    this.props.onEntriesChange(pasteEntry(this.props.entries, path, e));

  _handleCopy = (path: string) =>
    this.setState({
      clipboard: this.props.entries.filter(e => e.item.path === path),
    });

  _handleClearClipboard = () =>
    this.setState({
      clipboard: [],
    });

  _toggleOpenFilesPane = () => this.setState(state => ({ openFilesPane: !state.openFilesPane }));

  _toggleProjectPane = () => this.setState(state => ({ projectPane: !state.projectPane }));

  _handleCreateFile = (path?: ?string) =>
    this.props.onEntriesChange(createNewEntry(this.props.entries, 'file', path));

  _handleCreateFolder = (path?: ?string) =>
    this.props.onEntriesChange(createNewEntry(this.props.entries, 'folder', path));

  _handleShowRepoManager = () => {
    Segment.getInstance().logEvent('IMPORT_REQUESTED');
    Segment.getInstance().startTimer('importStart');
    this.setState({
      isRepoManagerShown: true,
    });
  };

  _handleHideRepoManager = () =>
    this.setState({
      isRepoManagerShown: false,
    });

  render() {
    return (
      <FileListImportManager
        className={css(styles.container)}
        entries={this.props.entries}
        onImportFile={this._handleEntryImport}
        uploadFileAsync={this.props.uploadFileAsync}
        render={({ onImportStart }) =>
          this.props.visible ? (
            <ResizablePane direction="horizontal" className={css(styles.pane)}>
              <SidebarShell>
                <RepoImportManager
                  visible={this.state.isRepoManagerShown}
                  onHide={this._handleHideRepoManager}
                  preventRedirectWarning={this.props.preventRedirectWarning}
                />
                <FileListPane
                  title="Open files"
                  expanded={this.state.openFilesPane}
                  onClick={this._toggleOpenFilesPane}>
                  <ul className={css(styles.tabs)} data-test-id="file-list-open-files-content">
                    {this.props.entries
                      /* $FlowFixMe */
                      .filter(e => e.item.type === 'file' && e.state.isOpen)
                      .map((e: any) => (
                        <FileListOpenEntry
                          key={e.item.path}
                          entry={e}
                          onOpen={() => this._handleEntryOpen(e.item.path)}
                          onClose={() => this._handleEntryClose(e.item.path)}
                          onCloseOthers={() => this._handleEntryCloseOthers(e.item.path)}
                          onCloseAll={this._handleEntryCloseAll}
                        />
                      ))}
                  </ul>
                </FileListPane>
                <FileListPane
                  className={css(styles.project)}
                  title="Project"
                  expanded={this.state.projectPane}
                  onClick={this._toggleProjectPane}
                  buttons={[
                    <FileListPaneButton key="create-file" onClick={() => this._handleCreateFile()}>
                      <path
                        fillOpacity="0.7"
                        d="M3,2 L13,2 L13,14 L3,14 L3,2 Z M9,2 L13,6 L13,2 L9,2 Z M9,6 L9,2 L8,2 L8,7 L13,7 L13,6 L9,6 Z"
                      />
                      <AddIcon />
                    </FileListPaneButton>,
                    <FileListPaneButton
                      key="create-folder"
                      onClick={() => this._handleCreateFolder()}>
                      <path
                        fillOpacity="0.7"
                        d="M7.25,4 L7.5,4 L7.5,3 L7,3.5 L7,2 L15,2 L15,4 L7.25,4 Z M6.75,4 L5,4 L7,2 L7,3.5 L6.5,4 L6.75,4 Z M1,4 L15,4 L15,14 L1,14 L1,4 Z M7.5,3 L7.5,4 L14,4 L14,3 L7.5,3 Z"
                      />
                      <AddIcon />
                    </FileListPaneButton>,
                    <FileListImportExportMenu
                      key="menu"
                      onImportFilesClick={onImportStart}
                      onImportRepoClick={this._handleShowRepoManager}
                      onExportClick={this.props.onDownloadCode}
                      saveStatus={this.props.saveStatus}
                      hasSnackId={this.props.hasSnackId}
                    />,
                  ]}>
                  <FileListEntryDropTarget
                    className={css(styles.files)}
                    rest={this.props.entries}
                    onRename={this._handleEntryRename}>
                    <div className={css(styles.children)} data-test-id="file-list-project-content">
                      <FileListChildren
                        parent=""
                        entries={this.props.entries}
                        clipboard={this.state.clipboard}
                        onCreateFile={this._handleCreateFile}
                        onCreateFolder={this._handleCreateFolder}
                        onOpen={this._handleEntryOpen}
                        onSelect={this._handleEntrySelect}
                        onFocus={this._handleEntryFocus}
                        onPaste={this._handleEntryPaste}
                        onRename={this._handleEntryRename}
                        onExpand={this._handleEntryExpand}
                        onDelete={this._handleEntryDelete}
                        onCopy={this._handleCopy}
                        onClearClipboard={this._handleClearClipboard}
                        theme={this.props.theme}
                        className={css(styles.list)}
                      />
                    </div>
                  </FileListEntryDropTarget>
                </FileListPane>
                {this.state.deleted
                  .map(group => (
                    <Toast
                      key={group.id}
                      label={`Deleted ${group.path.split('/').pop()}`}
                      actions={[
                        {
                          label: 'Undo',
                          action: () => {
                            this._restoreEntries(group.entries);
                            this._handleDismissDelete(group.id);
                          },
                        },
                        { label: 'Dismiss' },
                      ]}
                      onDismiss={() => this._handleDismissDelete(group.id)}
                    />
                  ))
                  .reverse()}
              </SidebarShell>
            </ResizablePane>
          ) : null}
      />
    );
  }
}

export default withThemeName(FileList);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  list: {
    padding: '0 12px',
    height: '100%',
  },
  pane: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: 240,
    minWidth: 240,
    height: '100%',
    zIndex: 10,
  },
  project: {
    flex: 1,
  },
  files: {
    flex: 1,
    overflow: 'auto',
  },
  children: {
    position: 'relative',
  },
  tabs: {
    margin: 0,
    listStyle: 'none',
    padding: '8px 0',
    overflow: 'auto',

    ':empty': {
      display: 'none',
    },
  },
  toolbar: {
    padding: 8,
  },
  toasts: {
    position: 'fixed',
    bottom: '3em',
    left: '1em',
    zIndex: 10,
  },
});
