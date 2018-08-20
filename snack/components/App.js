/* @flow */

import * as React from 'react';
import { connect } from 'react-redux';
import JSON5 from 'json5';
import mapValues from 'lodash/mapValues';
import Raven from 'raven-js';
import shortid from 'shortid';
import debounce from 'lodash/debounce';

import SnackSessionWorker from '../workers/snack-session.worker';
import Segment from '../utils/Segment';
import withAuth, { type AuthProps } from '../auth/withAuth';
import AuthManager from '../auth/authManager';

import LazyLoad from './shared/LazyLoad';
import AppShell from './Shell/AppShell';
import EmbeddedShell from './Shell/EmbeddedShell';
import AppDetails from './AppDetails';
import constants from '../configs/constants';
import { versions, DEFAULT_SDK_VERSION, FALLBACK_SDK_VERSION } from '../configs/sdk';
import { snackToEntryArray, entryArrayToSnack } from '../utils/convertFileStructure';
import { isNotMobile } from '../utils/detectPlatform';
import { isPackageJson } from '../utils/fileUtilities';
import { getSnackName } from '../utils/projectNames';
import updateEntry from '../actions/updateEntry';
import FeatureFlags from '../utils/FeatureFlags';

import type { SDKVersion } from '../configs/sdk';
import type { FileSystemEntry, TextFileEntry, AssetFileEntry, Snack, QueryParams } from '../types';

const Auth = new AuthManager();

const DEVICE_ID_KEY = '__SNACK_DEVICE_ID';

const INITIAL_CODE = {
  'App.js': {
    contents: `import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Constants } from 'expo';

// You can import from local files
import AssetExample from './components/AssetExample';

// or any pure javascript modules available in npm
import { Card } from 'react-native-elements'; // 0.19.1

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>
          Change code in the editor and watch it change on your phone! Save to get a shareable url.
        </Text>
        <Card title="Local Modules">
          <AssetExample />
        </Card>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  },
});
`,
    type: 'CODE',
  },
  'assets/expo.symbol.white.png': {
    contents:
      'https://snack-code-uploads.s3-us-west-1.amazonaws.com/~asset/bf93196f5649c822ee2eb830cfdfb636',
    type: 'ASSET',
  },
  'components/AssetExample.js': {
    contents: `import * as React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

export default class AssetExample extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>
          Local files and assets can be imported by dragging and dropping them into the editor
        </Text>
        <Image style={styles.logo} source={require("../assets/expo.symbol.white.png")}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paragraph: {
    margin: 24,
    marginTop: 0,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  },
  logo: {
    backgroundColor: "#056ecf",
    height: 128,
    width: 128,
  }
});
`,
    type: 'CODE',
  },
};

const INITIAL_DEPENDENCIES = {
  'react-native-elements': { version: '0.19.1', isUserSpecified: true },
};

type Device = { name: string, id: string, platform: string };

type DeviceError = {|
  loc?: [number, number],
  line?: number,
  column?: number,
  message: string,
|};

type DeviceLog = {|
  device: Device,
  method: 'log' | 'error' | 'warn',
  payload: Array<any>,
|};

type Params = {
  id?: string,
  platform?: 'android' | 'ios',
  sdkVersion?: SDKVersion,
  username?: string,
  projectName?: string,
};

type Props = AuthProps & {|
  snack?: Snack,
  history: {
    push: (props: { pathname: string, search: string }) => mixed,
  },
  match: {
    params: Params,
  },
  location: Object,
  query: QueryParams,
  isEmbedded?: boolean,
|};

type State = {|
  snackSessionState: {
    name: string,
    description: ?string,
    files: {},
    dependencies: {},
    sdkVersion: SDKVersion,
    isSaved: boolean,
    isResolving: boolean,
    loadingMessage: ?string,
  },
  channel: string,
  deviceId: string,
  params: Params,
  fileEntries: Array<FileSystemEntry>,
  connectedDevices: Array<Device>,
  deviceError: ?DeviceError,
  deviceLogs: Array<DeviceLog>,
  isPreview: boolean,
  wasUpgraded: boolean,
|};

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const usingDefaultCode = !(
      (props.snack && props.snack.code) ||
      (props.query && props.query.code)
    );

    let code = props.snack && props.snack.code ? props.snack.code : INITIAL_CODE;

    let name = getSnackName();
    let description = undefined;
    // TODO(satya164): is this correct? we don't match for sdkVersion in the router
    let sdkVersion = props.match.params.sdkVersion || DEFAULT_SDK_VERSION;
    let dependencies = usingDefaultCode ? INITIAL_DEPENDENCIES : {};

    if (props.snack && props.snack.dependencies) {
      dependencies = props.snack.dependencies;
    }

    if (props.snack && props.snack.manifest) {
      const { manifest } = props.snack;
      name = manifest.name;
      description = manifest.description;
      sdkVersion = manifest.sdkVersion || sdkVersion;
    }

    if (props.query) {
      name = props.query.name || name;
      description = props.query.description || description;
      sdkVersion = props.query.sdkVersion || sdkVersion;
      code = props.query.code || code;
    }

    let wasUpgraded = false;

    if (!versions.hasOwnProperty(sdkVersion)) {
      Segment.getInstance().logEvent('LOADED_UNSUPPORTED_VERSION', {
        requestedVersion: sdkVersion,
        snackId: this.props.match.params.id,
      });
      sdkVersion = FALLBACK_SDK_VERSION;
      wasUpgraded = true;
    }

    if (typeof code === 'string') {
      // Code is from SDK version below 21.0.0 without multiple files support
      // Or came from embed parameters which is a string
      // Upgrade code to new format with multiple entries
      code = {
        'App.js': { contents: code, type: 'CODE' },
      };
    }

    const isMobile = !isNotMobile();
    const isPreview = !!(
      isMobile &&
      (props.match.params.id || props.match.params.projectName) &&
      !props.isEmbedded
    );

    const fileEntries = snackToEntryArray(code);

    const params = {
      platform: props.query.platform,
      sdkVersion: props.query.sdkVersion,
      ...(!props.match.params.id && props.match.params.username && props.match.params.projectName
        ? { id: `@${props.match.params.username}/${props.match.params.projectName}` }
        : null),
    };

    // Create an initial snack session state from the data we have
    // After the worker is created, it'll be replaced with uptodate data
    const snackSessionState = {
      name,
      description,
      files: code,
      dependencies,
      sdkVersion,
      isSaved: false,
      isResolving: false,
      loadingMessage: undefined,
    };

    this.state = {
      snackSessionState,
      fileEntries: FeatureFlags.isAvailable('PROJECT_DEPENDENCIES', sdkVersion)
        ? [...fileEntries, this._getPackageJson(snackSessionState)]
        : fileEntries,
      connectedDevices: [],
      deviceLogs: [],
      deviceError: null,
      channel: '',
      deviceId: '',
      isPreview,
      params,
      wasUpgraded,
    };
  }

  componentDidMount() {
    if (window.location.host.includes('expo.io')) {
      Raven.config('https://6501f7d527764d85b045b0ce31927c75@sentry.io/191351').install();
      Raven.setTagsContext({
        build_date: new Date(process.env.BUILD_TIMESTAMP || 0).toUTCString(),
      });
    }

    this._intializeSnackSessionWorker();
  }

  _isSnackSessionWorkerReady: boolean;
  _actionQueue = [];

  _sendAction = (action: { type: string, payload?: any }) => {
    if (this._isSnackSessionWorkerReady) {
      // If worker is ready, send the action
      this._snackSessionWorker.postMessage(action);
    } else {
      // Otherwise add the actions to a queue we'll send when it's ready
      this._actionQueue.push(action);
    }
  };

  _intializeSnackSessionWorker = () => {
    /* $FlowFixMe */
    this._snackSessionWorker = new SnackSessionWorker();

    this._snackSessionWorker.addEventListener('message', event => {
      const { type, payload } = event.data;

      switch (type) {
        case 'READY':
          this._isSnackSessionWorkerReady = true;
          this._initializeSnackSession();

          // When the worker is ready, send all the queued actions
          this._actionQueue.forEach(action => this._sendAction(action));
          this._actionQueue = [];
          break;
        case 'STATE': {
          const snackSessionState = payload;

          this.setState(state => {
            let { fileEntries } = state;

            const currentFile = this._findFocusedEntry(fileEntries);

            if (
              currentFile &&
              snackSessionState.files.hasOwnProperty(currentFile.item.path) &&
              snackSessionState.files[currentFile.item.path].contents !==
                (currentFile.item.asset ? currentFile.item.uri : currentFile.item.content)
            ) {
              const contents = snackSessionState.files[currentFile.item.path].contents;

              fileEntries = fileEntries.map(entry => {
                if (entry.item.path === currentFile.item.path && entry.item.type === 'file') {
                  if (entry.item.asset) {
                    if (entry.item.uri !== contents) {
                      return updateEntry(entry, {
                        item: { uri: contents },
                      });
                    }
                  } else {
                    if (entry.item.content !== contents) {
                      return updateEntry(entry, {
                        item: { content: contents },
                      });
                    }
                  }
                }

                return entry;
              });
            }

            if (state.snackSessionState.sdkVersion !== snackSessionState.sdkVersion) {
              const packageJson = fileEntries.find(entry => isPackageJson(entry.item.path));

              if (
                FeatureFlags.isAvailable(
                  'PROJECT_DEPENDENCIES',
                  ((snackSessionState.sdkVersion: any): SDKVersion)
                )
              ) {
                if (!packageJson) {
                  fileEntries = [...fileEntries, this._getPackageJson(snackSessionState)];
                }
              } else {
                if (packageJson) {
                  fileEntries = fileEntries.filter(entry => !isPackageJson(entry.item.path));
                }
              }
            }

            if (
              state.snackSessionState.dependencies !== snackSessionState.dependencies &&
              FeatureFlags.isAvailable(
                'PROJECT_DEPENDENCIES',
                ((snackSessionState.sdkVersion: any): SDKVersion)
              )
            ) {
              fileEntries = fileEntries.map(entry => {
                if (isPackageJson(entry.item.path)) {
                  let previous = null;

                  try {
                    // Use JSON5 for a more forgiving approach, e.g. trailing commas
                    // $FlowFixMe
                    previous = JSON5.parse(entry.item.content);
                    const dependencies = mapValues(
                      snackSessionState.dependencies,
                      dep => dep.version
                    );
                    // $FlowFixMe
                    return {
                      ...entry,
                      item: {
                        ...entry.item,
                        content: JSON.stringify(
                          {
                            ...previous,
                            dependencies: {
                              ...previous.dependencies,
                              ...dependencies,
                            },
                          },
                          null,
                          2
                        ),
                      },
                    };
                  } catch (e) {
                    // Do nothing
                  }
                }

                return entry;
              });
            }

            return {
              snackSessionState,
              fileEntries,
            };
          });
          break;
        }

        case 'PRESENCE': {
          if (payload.status === 'join') {
            this.setState(state => ({
              connectedDevices: [...state.connectedDevices, payload.device],
            }));
          } else if (payload.status === 'leave') {
            this.setState(state => ({
              connectedDevices: state.connectedDevices.filter(
                device => device.id !== payload.device.id
              ),
            }));
          }

          break;
        }

        case 'ERROR': {
          const errors = payload;

          let deviceError: ?DeviceError = null;

          if (errors.length) {
            deviceError = {
              message: errors[0].message,
            };

            if (errors[0].startColumn && errors[0].startLine) {
              deviceError.loc = [errors[0].startLine, errors[0].startColumn];
            }

            if (errors[0].startLine) {
              deviceError.line = errors[0].startLine;
            }

            if (errors[0].startColumn) {
              deviceError.column = errors[0].startColumn;
            }
          }

          this.setState({
            deviceError,
          });

          break;
        }

        case 'LOG': {
          const deviceLog = {
            device: payload.device,
            method: payload.method,
            payload: payload.arguments,
          };

          this.setState(state => ({
            deviceLogs: [...state.deviceLogs.slice(-99), deviceLog],
          }));

          break;
        }

        case 'CHANNEL':
          this.setState({ channel: payload });
          break;

        case 'DEPENDENCY_ERROR':
          Raven.captureMessage(payload);
          break;
      }
    });
  };

  _initializeSnackSession = () => {
    const { snackSessionState, params, wasUpgraded } = this.state;

    let deviceId;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        deviceId = localStorage.getItem(DEVICE_ID_KEY);
      }

      if (deviceId) {
        this.setState({ deviceId });
      }
    } catch (e) {
      // Ignore error
    }

    this._sendAction({
      type: 'INIT',
      payload: {
        verbose: false,
        snackId: !wasUpgraded ? params.id : null,
        files: snackSessionState.files,
        name: snackSessionState.name,
        description: snackSessionState.description,
        sdkVersion: snackSessionState.sdkVersion,
        dependencies: snackSessionState.dependencies,
        user: { idToken: Auth.currentIdToken, sessionSecret: Auth.currentSessionSecret },
        deviceId,
      },
    });

    const isLocal = window.location.host.includes('expo.test');
    const isStaging = window.location.host.includes('staging');

    if (isStaging) {
      this._sendAction({
        type: 'SET_PROPERTIES',
        payload: { host: 'staging.expo.io' },
      });
    } else if (isLocal) {
      this._sendAction({
        type: 'SET_PROPERTIES',
        payload: { host: constants.ngrok },
      });
    }

    if (this.props.query.local_snackager === 'true') {
      this._sendAction({
        type: 'SET_PROPERTIES',
        payload: {
          snackagerUrl: 'http://localhost:3001',
          snackagerCloudfrontUrl: 'https://ductmb1crhe2d.cloudfront.net',
        },
      });
    } else if (isStaging) {
      this._sendAction({
        type: 'SET_PROPERTIES',
        payload: {
          snackagerUrl: 'https://staging.snackager.expo.io',
          snackagerCloudfrontUrl: 'https://ductmb1crhe2d.cloudfront.net',
        },
      });
    }

    const sessionSecret = this.props.getSessionSecret();

    if (sessionSecret) {
      this._sendAction({
        type: 'SET_USER',
        payload: { sessionSecret },
      });
    }

    this._sendAction({ type: 'START' });

    Segment.getInstance().setCommonData({
      snackId: this.state.params.id,
      isEmbedded: this.props.isEmbedded || false,
    });
    Segment.getInstance().logEvent('LOADED_SNACK', {
      sdkVersion: this.state.snackSessionState.sdkVersion,
    });
  };

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.fileEntries === prevState.fileEntries) {
      return;
    }

    let shouldUpdateSnackSession = false;

    if (this.state.fileEntries.length !== prevState.fileEntries.length) {
      shouldUpdateSnackSession = true;
    } else {
      const items = prevState.fileEntries.reduce((acc, { item }) => {
        acc[item.path] = item;
        return acc;
      }, {});

      shouldUpdateSnackSession = this.state.fileEntries.some(
        ({ item }) => !item.virtual && items[item.path] !== item
      );
    }

    if (shouldUpdateSnackSession) {
      this._sendCode();
    }
  }

  componentWillUnmount() {
    this._snackSessionWorker && this._snackSessionWorker.terminate();
  }

  _snackSessionWorker: Worker;

  _performAction = (type: string, data?: any, callback?: Function) =>
    new Promise((resolve, reject) => {
      const version = shortid.generate();
      const listener = ({ data }: any) => {
        const remove = () => this._snackSessionWorker.removeEventListener('message', listener);

        if (data.type === `${type}_SUCCESS` && data.payload.version === version) {
          resolve(data.payload.result);
          remove();
        } else if (data.type === `${type}_ERROR` && data.payload.version === version) {
          const { message, stack } = data.payload.error;
          const error = new Error(message);

          error.stack = stack;

          reject(error);
          remove();
        } else if (
          data.type === `${type}_CALLBACK` &&
          data.payload.version === version &&
          callback
        ) {
          callback(...data.payload.args);
        }
      };

      this._snackSessionWorker.addEventListener('message', listener);
      this._sendAction({ type, payload: { version, data } });
    });

  _sendCodeNotDebounced = () =>
    this._sendAction({
      type: 'SEND_CODE',
      // map state.fileEntries to the correct type before sending to snackSession
      /* $FlowFixMe */
      payload: entryArrayToSnack(this.state.fileEntries.filter(e => !e.item.virtual)),
    });

  _sendCode = debounce(this._sendCodeNotDebounced, 1000);

  _getPackageJson = snackSessionState => ({
    item: {
      path: 'package.json',
      type: 'file',
      content: JSON.stringify(
        {
          dependencies: mapValues(snackSessionState.dependencies, dep => dep.version),
        },
        null,
        2
      ),
      virtual: true,
    },
    state: {},
  });

  _handleChangeName = (name: string) => this._sendAction({ type: 'SET_NAME', payload: name });

  _handleChangeDescription = (description: string) =>
    this._sendAction({ type: 'SET_DESCRIPTION', payload: description });

  _handleChangeCode = (content: string) =>
    this.setState((state: State) => ({
      fileEntries: state.fileEntries.map(entry => {
        if (entry.item.type === 'file' && entry.state.isFocused) {
          return updateEntry(entry, { item: { content } });
        }
        return entry;
      }),
      deviceError: null,
    }));

  _handleFileEntriesChange = (fileEntries: FileSystemEntry[]): Promise<void> =>
    new Promise(resolve => this.setState({ fileEntries }, resolve));

  _handleChangeSDKVersion = (sdkVersion: SDKVersion) =>
    // TODO: if there are multiple files, check that the SDK version supports this
    this._sendAction({ type: 'SET_SDK_VERSION', payload: sdkVersion });

  _handleClearDeviceLogs = () =>
    this.setState({
      deviceLogs: [],
    });

  //TODO: better way of getting snack id
  _handleDownloadAsync = async () => {
    // Already check if Snack is saved in EditorView.js
    const snackId = this.state.params.id;

    // this shouldn't happen
    if (!snackId) {
      return;
    }

    /* $FlowIgnore */
    const url = `${process.env.API_SERVER_URL}/--/api/v2/snack/download/${snackId}`;

    // Simulate link click to download file
    let element = document.createElement('a');
    if (element && document.body) {
      document.body.appendChild(element);
      element.setAttribute('href', url);
      element.setAttribute('download', 'snack.zip');
      element.style.display = '';
      element.click();
      // $FlowIgnore
      document.body.removeChild(element);
    }
  };

  // TODO: (tc) Remove flowFixMe once types.js has been fixed
  _handlePublishAsync = async (options: { allowedOnProfile?: boolean }) => {
    // Send updated code first
    this._sendCodeNotDebounced();

    const cntCodeFile = this.state.fileEntries.filter(
      /* $FlowFixMe */
      entry => entry.item && entry.item.type === 'file' && !entry.item.asset
    ).length;
    const cntAssetFile = this.state.fileEntries.filter(
      /* $FlowFixMe */
      entry => entry.item.type && entry.item.type === 'file' && entry.item.asset
    ).length;
    const cntDirectory = this.state.fileEntries.filter(entry => entry.item.type === 'folder')
      .length;
    Segment.getInstance().logEvent(
      'SAVED_SNACK',
      { cntCodeFile, cntAssetFile, cntDirectory },
      'lastSave'
    );
    Segment.getInstance().startTimer('lastSave');

    if (options.allowedOnProfile) {
      this._updateUser();
    } else {
      this._sendAction({
        type: 'SET_USER',
        payload: { sessionSecret: undefined },
      });
    }

    const saveResult = await this._performAction('SAVE');

    this.props.history.push({
      pathname: `/${saveResult.id}`,
      search: this.props.location.search,
    });

    this.setState(state => ({
      params: {
        ...state.params,
        id: saveResult.id,
      },
    }));
  };

  _updateUser = () => {
    const sessionSecret = this.props.getSessionSecret();
    if (sessionSecret) {
      this._sendAction({
        type: 'SET_USER',
        payload: { sessionSecret },
      });
    }
  };

  _setDeviceId = (deviceId: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
      } catch (e) {
        // Do nothing
      }
    }

    this._sendAction({
      type: 'SET_DEVICE_ID',
      payload: deviceId,
    });
  };

  _findFocusedEntry = (entries: FileSystemEntry[]): ?(TextFileEntry | AssetFileEntry) =>
    /* $FlowFixMe */
    entries.find(
      /* $FlowFixMe */
      ({ item, state }) => item.type === 'file' && state.isFocused
    );

  _handleOpenEditor = () => this.setState({ isPreview: false });

  _uploadAssetAsync = asset => this._performAction('UPLOAD_ASSET', asset);

  _syncDependenciesAsync = (dependencies, callback) =>
    this._performAction('SYNC_DEPENDENCIES', dependencies, callback);

  render() {
    if (this.state.isPreview) {
      return (
        <AppDetails
          name={this.state.snackSessionState.name}
          description={this.state.snackSessionState.description}
          channel={this.state.channel}
          snackId={this.state.params.id}
          sdkVersion={this.state.snackSessionState.sdkVersion}
          onOpenEditor={this._handleOpenEditor}
        />
      );
    } else {
      return (
        <LazyLoad
          load={() => {
            if (this.props.isEmbedded) {
              return import('./EmbeddedEditorView');
            } else {
              return import('./EditorView');
            }
          }}>
          {({ loaded, data: Comp }) =>
            loaded ? (
              <Comp
                creatorUsername={this.state.params.username}
                fileEntries={this.state.fileEntries}
                entry={this._findFocusedEntry(this.state.fileEntries)}
                channel={this.state.channel}
                name={this.state.snackSessionState.name}
                description={this.state.snackSessionState.description}
                sdkVersion={this.state.snackSessionState.sdkVersion}
                isPublished={this.state.snackSessionState.isSaved}
                isResolving={this.state.snackSessionState.isResolving}
                loadingMessage={this.state.snackSessionState.loadingMessage}
                dependencies={this.state.snackSessionState.dependencies}
                params={this.state.params}
                onFileEntriesChange={this._handleFileEntriesChange}
                onChangeCode={this._handleChangeCode}
                onChangeName={this._handleChangeName}
                onChangeDescription={this._handleChangeDescription}
                onChangeSDKVersion={this._handleChangeSDKVersion}
                onClearDeviceLogs={this._handleClearDeviceLogs}
                onPublishAsync={this._handlePublishAsync}
                onSignIn={this._updateUser}
                onDownloadAsync={this._handleDownloadAsync}
                uploadFileAsync={this._uploadAssetAsync}
                syncDependenciesAsync={this._syncDependenciesAsync}
                setDeviceId={this._setDeviceId}
                deviceId={this.state.deviceId}
                connectedDevices={this.state.connectedDevices}
                deviceError={this.state.deviceError}
                deviceLogs={this.state.deviceLogs}
                sessionID={this.props.query.session_id}
                query={this.props.query}
                wasUpgraded={this.state.wasUpgraded}
                viewer={this.props.viewer}
              />
            ) : this.props.isEmbedded ? (
              <EmbeddedShell />
            ) : (
              <AppShell />
            )}
        </LazyLoad>
      );
    }
  }
}

export default connect(state => ({
  viewer: state.viewer,
}))(withAuth(App));
