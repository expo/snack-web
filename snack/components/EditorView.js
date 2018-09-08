/* @flow */

import * as React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, css } from 'aphrodite';
import debounce from 'lodash/debounce';

import Segment from '../utils/Segment';

import LazyLoad from './shared/LazyLoad';
import ModalDialog from './shared/ModalDialog';
import Banner from './shared/Banner';
import KeybindingsManager from './shared/KeybindingsManager';
import ProgressIndicator from './shared/ProgressIndicator';
import ContentShell from './Shell/ContentShell';
import LayoutShell from './Shell/LayoutShell';
import EditorShell from './Shell/EditorShell';
import PageMetadata from './PageMetadata';
import DeviceInstructionsModal, {
  type ConnectionMethod,
} from './DeviceInstructions/DeviceInstructionsModal';
import EmbedCode from './EmbedCode';
import DevicePreview from './DevicePreview';
import EditorToolbar from './EditorToolbar';
import EditorPanels from './EditorPanels';
import EditorFooter from './EditorFooter';
import AssetViewer from './AssetViewer';
import NoFileSelected from './NoFileSelected';
import FileList from './FileList/FileList';
import PublishManager, { type PublishModals } from './Publish/PublishManager';
import DependencyManager from './DependencyManager';
import KeyboardShortcuts, { Shortcuts } from './KeyboardShortcuts';

import openEntry from '../actions/openEntry';

import FeatureFlags from '../utils/FeatureFlags';
import { isInsideFolder, changeParentPath } from '../utils/fileUtilities';
import * as defaults from '../configs/defaults';

import convertErrorToAnnotation from '../utils/convertErrorToAnnotation';
import lintEntry from '../utils/lintEntry';
import prettierCode from '../utils/prettierCode';
import { isIntentionallyNamed } from '../utils/projectNames';
import withPreferences, { type PreferencesContextType } from './Preferences/withPreferences';
import withThemeName, { type ThemeName } from './Preferences/withThemeName';

import type { Error as DeviceError, Annotation } from '../utils/convertErrorToAnnotation';
import type { SDKVersion } from '../configs/sdk';
import type { FileSystemEntry, TextFileEntry, AssetFileEntry, Viewer } from '../types';

const EDITOR_LOAD_FALLBACK_TIMEOUT = 3000;
const DEFAULT_METADATA_NAME = 'Snack';
const DEFAULT_METADATA_DESCRIPTION_EMPTY = `Write code in Expo's online editor and instantly use it on your phone.`;
const DEFAULT_METADATA_DESCRIPTION_SAVED = `Try this project on your phone! Use Expo's online editor to make changes and save your own copy.`;

type Device = {| name: string, id: string, platform: string |};

type DeviceLog = {|
  device: Device,
  method: 'log' | 'error' | 'warn',
  payload: Array<any>,
|};

type Props = PreferencesContextType & {|
  viewer?: Viewer,
  creatorUsername?: string,
  fileEntries: FileSystemEntry[],
  entry: TextFileEntry | AssetFileEntry,
  name: string,
  description: string,
  dependencies: { [name: string]: { version: string } },
  params: {
    id?: string,
    platform?: 'android' | 'ios',
  },
  channel: string,
  isPublished: boolean,
  isResolving: boolean,
  loadingMessage: ?string,
  sessionID: ?string,
  connectedDevices: Array<Device>,
  deviceError: ?DeviceError,
  deviceLogs: Array<DeviceLog>,
  sdkVersion: SDKVersion,
  onClearDeviceLogs: () => void,
  onFileEntriesChange: (entries: FileSystemEntry[]) => Promise<void>,
  onChangeCode: (code: string) => void,
  onChangeName: (name: string) => void,
  onChangeDescription: (description: string) => void,
  onChangeSDKVersion: (sdkVersion: SDKVersion) => void,
  onPublishAsync: (options: { allowedOnProfile?: boolean }) => Promise<void>,
  onDownloadAsync: () => Promise<void>,
  onSignIn: () => Promise<void>,
  uploadFileAsync: (file: File) => Promise<string>,
  syncDependenciesAsync: (
    modules: { [name: string]: ?string },
    onError: (name: string, e: Error) => mixed
  ) => Promise<void>,
  setDeviceId: (deviceId: string) => Promise<void>,
  deviceId: ?string,
  theme: ThemeName,
  testPreviewPlatform?: 'android' | 'ios',
  testConnectionMethod?: ConnectionMethod,
  previewQueue: 'standard' | 'test',
  wasUpgraded: boolean,
|};

type State = {|
  currentModal: PublishModals | 'device-instructions' | 'embed' | 'edit-info' | 'shortcuts' | null,
  currentBanner:
    | 'connected'
    | 'disconnected'
    | 'reconnect'
    | 'embed-unavailable'
    | 'slow-connection'
    | null,
  loadedEditor: 'monaco' | 'simple' | null,
  isDownloading: boolean,
  deviceLogsShown: boolean,
  lintErrors: Array<Annotation>,
  name: string,
  description: string,
  shouldPreventRedirectWarning: boolean,
|};

const BANNER_TIMEOUT_SHORT = 1500;
const BANNER_TIMEOUT_LONG = 5000;

class EditorView extends React.Component<Props, State> {
  state = {
    loadedEditor: null,
    currentModal: null,
    currentBanner: null,
    isDownloading: false,
    deviceLogsShown: false,
    lintErrors: [],
    name: this.props.name,
    description: this.props.description,
    shouldPreventRedirectWarning: false,
  };

  componentWillMount() {
    const { testPreviewPlatform, testConnectionMethod, preferences } = this.props;

    if (testPreviewPlatform || testConnectionMethod) {
      this.props.setPreferences({
        deviceConnectionMethod: testConnectionMethod || preferences.deviceConnectionMethod,
        devicePreviewPlatform: testPreviewPlatform || preferences.devicePreviewPlatform,
      });
    }
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this._handleUnload);

    // Load prettier early so that clicking on the prettier button doesn't take too long
    setTimeout(() => prettierCode(''), 5000);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.entry !== nextProps.entry) {
      this._lint(nextProps.entry);
    }

    if (this.props.connectedDevices !== nextProps.connectedDevices) {
      if (this.props.connectedDevices.length < nextProps.connectedDevices.length) {
        Segment.getInstance().logEvent('CONNECTED_DEVICE');
        if (this.props.connectedDevices.length === 0) {
          Segment.getInstance().startTimer('deviceConnected');
        }
        this.setState({
          currentBanner: 'connected',
        });
        setTimeout(() => this.setState({ currentBanner: null }), BANNER_TIMEOUT_SHORT);
      }
      if (this.props.connectedDevices.length > nextProps.connectedDevices.length) {
        if (nextProps.connectedDevices.length === 0) {
          Segment.getInstance().logEvent('DISCONNECTED_DEVICE', {}, 'deviceConnected');
        } else {
          Segment.getInstance().logEvent('DISCONNECTED_DEVICE');
        }
        this.setState({ currentBanner: 'disconnected' });
        setTimeout(() => this.setState({ currentBanner: null }), BANNER_TIMEOUT_SHORT);
      }
    }

    if (this.props.sdkVersion !== nextProps.sdkVersion && nextProps.connectedDevices.length) {
      this.setState({
        currentBanner: 'reconnect',
        // currentModal: 'device-instructions',
      });
      setTimeout(() => this.setState({ currentBanner: null }), BANNER_TIMEOUT_LONG);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this._handleUnload);
  }

  _isPublished = () => {
    return this.props.isPublished && this.props.name === this.state.name;
  };

  _handleUnload = (e: any) => {
    if (this._isPublished() || this.state.shouldPreventRedirectWarning) {
      this._allowRedirectWarning();
      return;
    }

    const message = 'You have unsaved changes. Are you sure you want to leave this page?';
    e.returnValue = message;
    return message;
  };

  _isJSFile = (entry: *) => entry && !entry.item.asset && entry.item.path.endsWith('.js');

  _isJSONFile = (entry: *) => entry && !entry.item.asset && entry.item.path.endsWith('.json');

  _lintNotDebounced = async (entry: *) => {
    const lintErrors = await lintEntry(entry, this.props.sdkVersion);

    if (!lintErrors.length && !this.state.lintErrors.length) {
      // There are no lint errors and nothing to clear
      return;
    }

    this.setState({ lintErrors });
  };

  _lint = debounce(this._lintNotDebounced, 500);

  _prettier = async () => {
    // $FlowFixMe this will fail if run against an asset file
    let code = this.props.entry.item.content;

    if (this._isJSFile(this.props.entry)) {
      /* $FlowFixMe */
      code = await prettierCode(code);
    } else if (this._isJSONFile(this.props.entry)) {
      code = JSON.stringify(JSON.parse(code), null, 2);
    }

    if (code !== this.props.entry.item.content) {
      this.props.onChangeCode(code);
    }
  };

  _restoreEmbedSession = () => {
    const { sessionID, onChangeCode } = this.props;

    if (typeof sessionID !== 'string') {
      return;
    }

    try {
      const sessionString = localStorage.getItem(sessionID);
      if (sessionString) {
        const session = JSON.parse(sessionString);
        if (session) {
          if (typeof session.code === 'string') {
            onChangeCode(session.code);
          }

          if (typeof session.platform === 'string') {
            this.props.setPreferences({
              devicePreviewPlatform: session.platform,
            });
          }
        }
      }
    } catch (e) {
      // Ignore
    } finally {
      localStorage.removeItem(sessionID);
    }
  };

  _handleSubmitMetadata = (details: { name: string, description: string }) =>
    new Promise(resolve => this.setState(details, resolve));

  _handleDismissEditModal = () => {
    Segment.getInstance().logEvent('DISMISSED_AUTH_MODAL', {
      currentModal: this.state.currentModal,
    });
    this.setState({ currentModal: null });
  };

  _handleShowTitleDescriptionModal = () => {
    this.setState({ currentModal: 'edit-info' });
  };

  _handleShowDeviceInstructions = () => {
    Segment.getInstance().logEvent('REQUESTED_QR_CODE');
    this.setState({ currentModal: 'device-instructions' });
  };

  _handleShowAuthModal = () => {
    this.setState({ currentModal: 'auth' });
  };

  _handleShowShortcuts = () => {
    this.setState({ currentModal: 'shortcuts' });
  };

  _handleHideModal = () => {
    this.setState({ currentModal: null });
  };

  _handleShowModal = (name: *) => {
    this.setState({ currentModal: name });
  };

  _handleShowEmbedCode = () => {
    if (!this.props.params.id) {
      this.setState({ currentBanner: 'embed-unavailable' });
      setTimeout(() => this.setState({ currentBanner: null }), BANNER_TIMEOUT_LONG);
      return;
    }

    Segment.getInstance().logEvent('REQUESTED_EMBED');

    this.setState({ currentModal: 'embed' });
  };

  _handlePublishAsync = async (options: *) => {
    this.props.onChangeName(this.state.name);
    this.props.onChangeDescription(this.state.description);

    await this.props.onPublishAsync(options);
  };

  _handleOpenPath = (path: string): Promise<void> =>
    this.props.onFileEntriesChange(openEntry(this.props.fileEntries, path, true));

  _handleRemoveFile = (path: string) => {
    const entry = this.props.fileEntries.find(({ item }) => item.path === path);

    if (entry && entry.item.type === 'folder') {
      this.props.fileEntries.forEach(({ item }) => {
        if (isInsideFolder(item.path, path)) {
          this._EditorComponent && this._EditorComponent.removePath(item.path);
        }
      });
    } else {
      this._EditorComponent && this._EditorComponent.removePath(path);
    }
  };

  _handleRenameFile = (oldPath: string, newPath: string) => {
    const entry = this.props.fileEntries.find(({ item }) => item.path === oldPath);

    if (entry && entry.item.type === 'folder') {
      this.props.fileEntries.forEach(({ item }) => {
        if (isInsideFolder(item.path, oldPath)) {
          const renamedPath = changeParentPath(item.path, oldPath, newPath);

          this._EditorComponent && this._EditorComponent.renamePath(item.path, renamedPath);
        }
      });
    } else {
      this._EditorComponent && this._EditorComponent.renamePath(oldPath, newPath);
    }
  };

  _EditorComponent: any;
  _editor: any;

  _showErrorPanel = () =>
    this.props.setPreferences({
      panelType: 'errors',
    });

  _showDeviceLogs = () =>
    this.props.setPreferences({
      panelType: 'logs',
    });

  _togglePanels = () =>
    this.props.setPreferences({
      panelsShown: !this.props.preferences.panelsShown,
    });

  _toggleFileTree = () =>
    this.props.setPreferences({
      fileTreeShown: !this.props.preferences.fileTreeShown,
    });

  _changeConnectionMethod = (deviceConnectionMethod: ConnectionMethod) =>
    this.props.setPreferences({ deviceConnectionMethod });

  _toggleDevicePreview = () =>
    this.props.setPreferences({
      devicePreviewShown: !this.props.preferences.devicePreviewShown,
    });

  _toggleEditorMode = () =>
    this.props.setPreferences({
      editorMode: this.props.preferences.editorMode === 'vim' ? 'normal' : 'vim',
    });

  _changeDevicePreviewPlatform = (platform: 'ios' | 'android') =>
    this.props.setPreferences({
      devicePreviewPlatform: platform,
    });

  _toggleTheme = (theme: ThemeName) =>
    this.props.setPreferences({
      theme: this.props.preferences.theme === 'light' ? 'dark' : 'light',
    });

  _preventRedirectWarning = () =>
    this.setState({
      shouldPreventRedirectWarning: true,
    });

  _allowRedirectWarning = () =>
    this.setState({
      shouldPreventRedirectWarning: false,
    });

  render() {
    const {
      currentModal,
      currentBanner,
      isDownloading,
      lintErrors,
      name,
      description,
    } = this.state;

    const {
      channel,
      entry,
      params,
      loadingMessage,
      sdkVersion,
      connectedDevices,
      deviceLogs,
      deviceError,
      onClearDeviceLogs,
      uploadFileAsync,
      preferences,
    } = this.props;

    const annotations = [];

    if (deviceError) {
      annotations.push(convertErrorToAnnotation(deviceError));
    }

    annotations.push(...lintErrors);

    const hasSnackId = !!params.id;
    const metadataName = isIntentionallyNamed(name) ? DEFAULT_METADATA_NAME : name;
    const metadataDescription =
      description === defaults.DEFAULT_DESCRIPTION
        ? hasSnackId ? DEFAULT_METADATA_DESCRIPTION_SAVED : DEFAULT_METADATA_DESCRIPTION_EMPTY
        : description;

    return (
      <ContentShell>
        {this.state.loadedEditor ? null : <ProgressIndicator />}
        <PageMetadata name={metadataName} description={metadataDescription} params={params} />
        <PublishManager
          snackId={params.id}
          sdkVersion={sdkVersion}
          creatorUsername={this.props.creatorUsername}
          name={name}
          description={description}
          onSubmitMetadata={this._handleSubmitMetadata}
          onPublishAsync={this._handlePublishAsync}
          onShowModal={this._handleShowModal}
          onHideModal={this._handleHideModal}
          currentModal={currentModal}
          nameHasChanged={this.props.name !== this.state.name}>
          {({ onPublishAsync, isPublishing }) => {
            const handleDownloadCode = async () => {
              // Make sure file is saved before downloading
              this.setState({ isDownloading: true });

              if (!this._isPublished()) {
                await onPublishAsync();
              }

              Segment.getInstance().logEvent('DOWNLOADED_CODE');

              await this.props.onDownloadAsync();

              this.setState({ isDownloading: false });
            };

            return (
              <React.Fragment>
                <KeybindingsManager
                  bindings={Shortcuts}
                  onTrigger={({ type }: *) => {
                    const commands = {
                      save: this._isPublished()
                        ? null
                        : this.props.isResolving ? null : onPublishAsync,
                      tree: this._toggleFileTree,
                      panels: this._togglePanels,
                      format: this._prettier,
                      shortcuts: this._handleShowShortcuts,
                    };

                    commands[type] && commands[type]();
                  }}
                />
                <EditorToolbar
                  name={name}
                  description={description}
                  isPublishing={isPublishing}
                  isDownloading={isDownloading}
                  isPublished={this._isPublished()}
                  isResolving={this.props.isResolving}
                  isEditModalVisible={currentModal === 'edit-info'}
                  isAuthModalVisible={currentModal === 'auth'}
                  onShowEditModal={this._handleShowTitleDescriptionModal}
                  onDismissEditModal={this._handleDismissEditModal}
                  onSubmitEditModal={this._handleSubmitMetadata}
                  onShowAuthModal={this._handleShowAuthModal}
                  onDismissAuthModal={this._handleHideModal}
                  onShowQRCode={this._handleShowDeviceInstructions}
                  onShowEmbedCode={this._handleShowEmbedCode}
                  onDownloadCode={handleDownloadCode}
                  onPublishAsync={onPublishAsync}
                  creatorUsername={this.props.creatorUsername}
                />
                <div className={css(styles.editorAreaOuterWrapper)}>
                  <div className={css(styles.editorAreaOuter)}>
                    <LayoutShell>
                      <FileList
                        visible={preferences.fileTreeShown}
                        entries={this.props.fileEntries}
                        onEntriesChange={this.props.onFileEntriesChange}
                        onRemoveFile={this._handleRemoveFile}
                        onRenameFile={this._handleRenameFile}
                        uploadFileAsync={uploadFileAsync}
                        onDownloadCode={handleDownloadCode}
                        preventRedirectWarning={this._preventRedirectWarning}
                        hasSnackId={hasSnackId}
                        isPublished={this._isPublished()}
                        sdkVersion={sdkVersion}
                      />
                      {/* Don't load it conditionally since we need the _EditorComponent object to be available */}
                      <LazyLoad
                        load={() => {
                          let timeout;

                          const MonacoEditor = import('./Editor/MonacoEditor');

                          // Fallback to simple editor if monaco editor takes too long to load
                          const SimpleEditor = new Promise((resolve, reject) => {
                            timeout = setTimeout(() => {
                              this.setState({ currentBanner: 'slow-connection' });
                              setTimeout(() => this.setState({ currentBanner: null }), 5000);

                              /* $FlowFixMe */
                              import('./Editor/SimpleEditor').then(resolve, reject);
                            }, EDITOR_LOAD_FALLBACK_TIMEOUT);
                          });

                          return Promise.race([
                            MonacoEditor.then(
                              editor => ({ editor, type: 'monaco' }),
                              () => SimpleEditor
                            ),
                            SimpleEditor.then(editor => ({ editor, type: 'simple' })),
                          ]).then(({ editor, type }) => {
                            this.setState({ loadedEditor: type });
                            clearTimeout(timeout);
                            return editor;
                          });
                        }}>
                        {({ loaded, data: Comp }) => {
                          this._EditorComponent = Comp;

                          if (entry && entry.item.type === 'file') {
                            if (entry.item.asset) {
                              return <AssetViewer entry={((entry: any): AssetFileEntry)} />;
                            }

                            if (loaded) {
                              return (
                                <Comp
                                  ref={c => (this._editor = c)}
                                  dependencies={this.props.dependencies}
                                  sdkVersion={sdkVersion}
                                  entries={this.props.fileEntries}
                                  autoFocus={!entry.state.isCreating}
                                  annotations={annotations}
                                  path={entry.item.path}
                                  value={entry.item.content}
                                  mode={preferences.editorMode}
                                  onValueChange={this.props.onChangeCode}
                                  onOpenPath={this._handleOpenPath}
                                />
                              );
                            }
                          } else {
                            return <NoFileSelected />;
                          }

                          return <EditorShell />;
                        }}
                      </LazyLoad>
                    </LayoutShell>
                    {preferences.panelsShown ? (
                      <EditorPanels
                        annotations={annotations}
                        deviceLogs={deviceLogs}
                        onShowErrorPanel={this._showErrorPanel}
                        onShowDeviceLogs={this._showDeviceLogs}
                        onTogglePanels={this._togglePanels}
                        onClearDeviceLogs={onClearDeviceLogs}
                        panelType={preferences.panelType}
                      />
                    ) : null}
                  </div>
                  {preferences.devicePreviewShown ? (
                    <DevicePreview
                      detachable
                      channel={channel}
                      snackId={params.id}
                      sdkVersion={sdkVersion}
                      platform={preferences.devicePreviewPlatform}
                      onClickRunOnPhone={this._handleShowDeviceInstructions}
                      wasUpgraded={this.props.wasUpgraded}
                      previewQueue="main"
                      canUserAuthenticate
                    />
                  ) : null}
                </div>
                <EditorFooter
                  loadingMessage={loadingMessage}
                  annotations={annotations}
                  connectedDevices={connectedDevices}
                  fileTreeShown={preferences.fileTreeShown}
                  devicePreviewShown={preferences.devicePreviewShown}
                  editorMode={preferences.editorMode}
                  devicePreviewPlatform={preferences.devicePreviewPlatform}
                  sdkVersion={sdkVersion}
                  onToggleTheme={this._toggleTheme}
                  onTogglePanels={this._togglePanels}
                  onToggleFileTree={this._toggleFileTree}
                  onToggleDevicePreview={this._toggleDevicePreview}
                  onToggleVimMode={
                    this.state.loadedEditor === 'monaco' ? this._toggleEditorMode : undefined
                  }
                  onChangeDevicePreviewPlatform={this._changeDevicePreviewPlatform}
                  onChangeSDKVersion={this.props.onChangeSDKVersion}
                  onPrettifyCode={this._prettier}
                />
                <DeviceInstructionsModal
                  visible={currentModal === 'device-instructions'}
                  onSignIn={this.props.onSignIn}
                  onDismiss={this._handleHideModal}
                  onChangeMethod={this._changeConnectionMethod}
                  method={preferences.deviceConnectionMethod}
                  sdkVersion={sdkVersion}
                  channel={channel}
                  snackId={params.id}
                  isEmbedded={false}
                  wasUpgraded={this.props.wasUpgraded}
                  setDeviceId={this.props.setDeviceId}
                  deviceId={this.props.deviceId}
                />
                <ModalDialog
                  className={css(styles.embedModal)}
                  autoSize={false}
                  visible={currentModal === 'embed'}
                  onDismiss={this._handleHideModal}>
                  <EmbedCode params={params} />
                </ModalDialog>
                <ModalDialog
                  visible={currentModal === 'shortcuts'}
                  onDismiss={this._handleHideModal}>
                  <KeyboardShortcuts />
                </ModalDialog>
                <Banner type="success" visible={currentBanner === 'connected'}>
                  Device connected!
                </Banner>
                <Banner type="error" visible={currentBanner === 'disconnected'}>
                  Device disconnected!
                </Banner>
                <Banner type="info" visible={currentBanner === 'reconnect'}>
                  Please close and reopen on your phone to see SDK version change.
                </Banner>
                <Banner type="info" visible={currentBanner === 'slow-connection'}>
                  Slow network detected. Trying to load a basic version of the editor. Some features
                  such as linting and autocomplete may not work.
                </Banner>
                <Banner type="info" visible={currentBanner === 'embed-unavailable'}>
                  You need to save the Snack first to get an Embed code!
                </Banner>
                {FeatureFlags.isAvailable('PROJECT_DEPENDENCIES', this.props.sdkVersion) ? (
                  <DependencyManager
                    fileEntries={this.props.fileEntries}
                    sdkVersion={this.props.sdkVersion}
                    dependencies={this.props.dependencies}
                    syncDependenciesAsync={this.props.syncDependenciesAsync}
                  />
                ) : null}
              </React.Fragment>
            );
          }}
        </PublishManager>
      </ContentShell>
    );
  }
}

export default withThemeName(
  withPreferences(
    connect((state, props) => ({
      viewer: state.viewer,
      testPreviewPlatform: state.splitTestSettings.defaultPreviewPlatform,
      testConnectionMethod: state.splitTestSettings.defaultConnectionMethod,
    }))(EditorView)
  )
);

const styles = StyleSheet.create({
  editorAreaOuter: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  },

  editorAreaOuterWrapper: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    minWidth: 0,
  },

  embedModal: {
    minWidth: 0,
    minHeight: 0,
    maxWidth: 'calc(100% - 48px)',
    maxHeight: 'calc(100% - 48px)',
  },
});
