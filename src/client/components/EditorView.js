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
import { c } from './ColorsProvider';

import type { Error as DeviceError, Annotation } from '../utils/convertErrorToAnnotation';
import type { SDKVersion } from '../configs/sdk';
import type { FileSystemEntry, TextFileEntry, AssetFileEntry, Viewer, SaveStatus } from '../types';

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
  createdAt: ?string,
  saveHistory: ?Array<{ id: string, savedAt: string }>,
  saveStatus: SaveStatus,
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
  isResolving: boolean,
  loadingMessage: ?string,
  sessionID: ?string,
  connectedDevices: Array<Device>,
  deviceError: ?DeviceError,
  deviceLogs: Array<DeviceLog>,
  initialSdkVersion: SDKVersion,
  sdkVersion: SDKVersion,
  onClearDeviceLogs: () => void,
  onFileEntriesChange: (entries: FileSystemEntry[]) => Promise<void>,
  onChangeCode: (code: string) => void,
  onSubmitMetadata: (
    details: { name: string, description: string },
    draft?: boolean
  ) => Promise<void>,
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
    | 'sdk-upgraded'
    | 'embed-unavailable'
    | 'export-unavailable'
    | 'slow-connection'
    | null,
  loadedEditor: 'monaco' | 'simple' | null,
  isDownloading: boolean,
  isMarkdownPreview: boolean,
  deviceLogsShown: boolean,
  lintErrors: Array<Annotation>,
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
    isMarkdownPreview: true,
    deviceLogsShown: false,
    lintErrors: [],
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

    if (this.props.wasUpgraded) {
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({ currentBanner: 'sdk-upgraded' });

      setTimeout(() => this.setState({ currentBanner: null }), BANNER_TIMEOUT_LONG);
    }
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

  _handleUnload = (e: any) => {
    const isSaved =
      this.props.saveStatus === 'saved-draft' || this.props.saveStatus === 'published';

    if (isSaved || this.state.shouldPreventRedirectWarning) {
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

  _toggleMarkdownPreview = () =>
    this.setState(state => ({ isMarkdownPreview: !state.isMarkdownPreview }));

  _preventRedirectWarning = () =>
    this.setState({
      shouldPreventRedirectWarning: true,
    });

  _allowRedirectWarning = () =>
    this.setState({
      shouldPreventRedirectWarning: false,
    });

  render() {
    const { currentModal, currentBanner, isDownloading, lintErrors } = this.state;

    const {
      channel,
      entry,
      params,
      createdAt,
      saveHistory,
      saveStatus,
      viewer,
      loadingMessage,
      sdkVersion,
      connectedDevices,
      deviceLogs,
      deviceError,
      onClearDeviceLogs,
      uploadFileAsync,
      preferences,
      name,
      description,
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
          onSubmitMetadata={this.props.onSubmitMetadata}
          onPublishAsync={this.props.onPublishAsync}
          onShowModal={this._handleShowModal}
          onHideModal={this._handleHideModal}
          currentModal={currentModal}>
          {({ onPublishAsync, isPublishing }) => {
            const handleDownloadCode = async () => {
              const isSaved = saveStatus === 'published' || saveStatus === 'saved-draft';

              if (!isSaved) {
                this.setState({ currentBanner: 'export-unavailable' });
                setTimeout(() => this.setState({ currentBanner: null }), BANNER_TIMEOUT_LONG);
                return;
              }

              // Make sure file is saved before downloading
              this.setState({ isDownloading: true });

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
                      save:
                        saveStatus === 'published'
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
                  createdAt={createdAt}
                  saveHistory={saveHistory}
                  saveStatus={saveStatus}
                  viewer={viewer}
                  isDownloading={isDownloading}
                  isResolving={this.props.isResolving}
                  isEditModalVisible={currentModal === 'edit-info'}
                  isAuthModalVisible={currentModal === 'auth'}
                  onShowEditModal={this._handleShowTitleDescriptionModal}
                  onDismissEditModal={this._handleDismissEditModal}
                  onSubmitMetadata={this.props.onSubmitMetadata}
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
                        saveStatus={saveStatus}
                        sdkVersion={sdkVersion}
                      />
                      {/* Don't load it conditionally since we need the _EditorComponent object to be available */}
                      <LazyLoad
                        load={() => {
                          let timeout;

                          const MonacoEditorPromise = import(/* webpackPreload: true */ './Editor/MonacoEditor').then(
                            editor => ({ editor, type: 'monaco' })
                          );

                          // Fallback to simple editor if monaco editor takes too long to load
                          const SimpleEditorPromise = new Promise((resolve, reject) => {
                            timeout = setTimeout(() => {
                              this.setState({ currentBanner: 'slow-connection' });

                              setTimeout(() => this.setState({ currentBanner: null }), 5000);

                              import('./Editor/SimpleEditor').then(resolve, reject);
                            }, EDITOR_LOAD_FALLBACK_TIMEOUT);
                          }).then(editor => ({ editor, type: 'simple' }));

                          return Promise.race([
                            MonacoEditorPromise.catch(() => SimpleEditorPromise),
                            SimpleEditorPromise,
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

                            const { content } = entry.item;
                            const isMarkdown = entry.item.path.endsWith('.md');

                            if (isMarkdown && this.state.isMarkdownPreview) {
                              return (
                                <React.Fragment>
                                  <LazyLoad load={() => import('./Markdown/MarkdownPreview')}>
                                    {({ loaded: mdLoaded, data: MarkdownPreview }) => {
                                      if (mdLoaded) {
                                        return <MarkdownPreview source={content} />;
                                      }

                                      return <EditorShell />;
                                    }}
                                  </LazyLoad>
                                  <button
                                    className={css(styles.previewToggle)}
                                    onClick={this._toggleMarkdownPreview}>
                                    <svg
                                      width="12px"
                                      height="12px"
                                      viewBox="0 0 18 18"
                                      className={css(styles.previewToggleIcon)}>
                                      <g transform="translate(-147.000000, -99.000000)">
                                        <g transform="translate(144.000000, 96.000000)">
                                          <path d="M3,17.25 L3,21 L6.75,21 L17.81,9.94 L14.06,6.19 L3,17.25 L3,17.25 Z M20.71,7.04 C21.1,6.65 21.1,6.02 20.71,5.63 L18.37,3.29 C17.98,2.9 17.35,2.9 16.96,3.29 L15.13,5.12 L18.88,8.87 L20.71,7.04 L20.71,7.04 Z" />
                                        </g>
                                      </g>
                                    </svg>
                                  </button>
                                </React.Fragment>
                              );
                            }

                            if (loaded) {
                              return (
                                <React.Fragment>
                                  <Comp
                                    ref={c => (this._editor = c)}
                                    dependencies={this.props.dependencies}
                                    sdkVersion={sdkVersion}
                                    entries={this.props.fileEntries}
                                    autoFocus={!entry.state.isCreating}
                                    annotations={annotations}
                                    path={entry.item.path}
                                    value={content}
                                    mode={preferences.editorMode}
                                    onValueChange={this.props.onChangeCode}
                                    onOpenPath={this._handleOpenPath}
                                  />
                                  {isMarkdown ? (
                                    <button
                                      className={css(styles.previewToggle)}
                                      onClick={this._toggleMarkdownPreview}>
                                      <svg
                                        width="16px"
                                        height="12px"
                                        viewBox="0 0 22 16"
                                        className={css(styles.previewToggleIcon)}>
                                        <g transform="translate(-145.000000, -1156.000000)">
                                          <g transform="translate(144.000000, 1152.000000)">
                                            <path d="M12,4.5 C7,4.5 2.73,7.61 1,12 C2.73,16.39 7,19.5 12,19.5 C17,19.5 21.27,16.39 23,12 C21.27,7.61 17,4.5 12,4.5 L12,4.5 Z M12,17 C9.24,17 7,14.76 7,12 C7,9.24 9.24,7 12,7 C14.76,7 17,9.24 17,12 C17,14.76 14.76,17 12,17 L12,17 Z M12,9 C10.34,9 9,10.34 9,12 C9,13.66 10.34,15 12,15 C13.66,15 15,13.66 15,12 C15,10.34 13.66,9 12,9 L12,9 Z" />
                                          </g>
                                        </g>
                                      </svg>
                                    </button>
                                  ) : null}
                                </React.Fragment>
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
                <Banner type="info" visible={currentBanner === 'sdk-upgraded'}>
                  This Snack was written in an older Expo version that is not longer supported. We
                  have upgraded the Expo version to {this.props.sdkVersion}.<br />
                  You might need to do some manual changes to make the Snack work correctly.
                </Banner>
                <Banner type="info" visible={currentBanner === 'reconnect'}>
                  Please close and reopen the Expo app on your phone to see the Expo version change.
                </Banner>
                <Banner type="info" visible={currentBanner === 'slow-connection'}>
                  Slow network detected. Trying to load a basic version of the editor. Some features
                  such as linting and autocomplete may not work.
                </Banner>
                <Banner type="info" visible={currentBanner === 'embed-unavailable'}>
                  You need to save the Snack first to get an Embed code!
                </Banner>
                <Banner type="info" visible={currentBanner === 'export-unavailable'}>
                  You need to save the Snack first to get export the code!
                </Banner>
                {FeatureFlags.isAvailable('PROJECT_DEPENDENCIES', this.props.sdkVersion) ? (
                  <DependencyManager
                    fileEntries={this.props.fileEntries}
                    onEntriesChange={this.props.onFileEntriesChange}
                    initialSdkVersion={this.props.initialSdkVersion}
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

  previewToggle: {
    appearance: 'none',
    position: 'absolute',
    right: 0,
    bottom: 0,
    margin: 32,
    padding: 12,
    height: 48,
    width: 48,
    border: 0,
    borderRadius: '50%',
    backgroundColor: c('accent'),
    color: c('accent-text'),
    outline: 0,

    ':focus-visible': {
      outline: 'auto',
    },
  },

  previewToggleIcon: {
    fill: 'currentColor',
    verticalAlign: -1,
  },
});
