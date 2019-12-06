import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import { connect } from 'react-redux';
import { create, persist } from 'web-worker-proxy';
import nullthrows from 'nullthrows';
import isEqual from 'lodash/isEqual';
import mapValues from 'lodash/mapValues';
import Raven from 'raven-js';
import debounce from 'lodash/debounce';
import BroadcastChannel from 'broadcast-channel';
import { SnackSessionOptions } from 'snack-sdk';
import Segment from '../utils/Segment';
import withAuth, { AuthProps } from '../auth/withAuth';
import AuthManager from '../auth/authManager';
import LazyLoad from './shared/LazyLoad';
import AppShell from './Shell/AppShell';
import EmbeddedShell from './Shell/EmbeddedShell';
import AppDetails from './AppDetails';
import constants from '../configs/constants';
import { versions, DEFAULT_SDK_VERSION, FALLBACK_SDK_VERSION } from '../configs/sdk';
import { snackToEntryArray, entryArrayToSnack } from '../utils/convertFileStructure';
import { isPackageJson } from '../utils/fileUtilities';
import { getSnackName } from '../utils/projectNames';
import { isMobile } from '../utils/detectPlatform';
import updateEntry from '../actions/updateEntry';
import { SDKVersion } from '../configs/sdk';
import AnimatedLogo from './shared/AnimatedLogo';

import {
  FileSystemEntry,
  TextFileEntry,
  AssetFileEntry,
  ExpoSnackFiles,
  Snack,
  QueryParams,
  SaveStatus,
  SaveHistory,
  Device,
  Platform,
} from '../types';
import { DEFAULT_DESCRIPTION } from '../configs/defaults';

const Auth = new AuthManager();

const DEVICE_ID_KEY = '__SNACK_DEVICE_ID';

const DEFAULT_CODE: ExpoSnackFiles = {
  'App.js': {
    contents: `import * as React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

// You can import from local files
import AssetExample from './components/AssetExample';

// or any pure javascript modules available in npm
import { Card } from 'react-native-paper';

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>
          Change code in the editor and watch it change on your phone! Save to get a shareable url.
        </Text>
        <Card>
          <AssetExample />
        </Card>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
`,
    type: 'CODE',
  },
  'assets/snack-icon.png': {
    contents:
      'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/2f7d32b1787708aba49b3586082d327b',
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
        <Image style={styles.logo} source={require('../assets/snack-icon.png')} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  paragraph: {
    margin: 24,
    marginTop: 0,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logo: {
    height: 128,
    width: 128,
  }
});
`,
    type: 'CODE',
  },
  'README.md': {
    contents: `# Sample Snack app

Open the \`App.js\` file to start writing some code. You can preview the changes directly on your phone or tablet by clicking the **Run** button or use the simulator by clicking **Tap to Play**. When you're done, click **Save** and share the link!

When you're ready to see everything that Expo provides (or if you want to use your own editor) you can **Export** your project and use it with [expo-cli](https://docs.expo.io/versions/latest/introduction/installation.html).

All projects created in Snack are publicly available, so you can easily share the link to this project via link, or embed it on a web page with the **Embed** button.

If you're having problems, you can tweet to us [@expo](https://twitter.com/expo) or ask in our [forums](https://forums.expo.io).

Snack is Open Source. You can find the code on the [GitHub repo](https://github.com/expo/snack-web).
`,
    type: 'CODE',
  },
};

const DEFAULT_DEPENDENCIES = {
  'react-native-paper': { version: '3.1.1', isUserSpecified: true },
};

const BROADCAST_CHANNEL_NAME = 'SNACK_BROADCAST_CHANNEL';

type DeviceError = {
  loc?: [number, number];
  line?: number;
  column?: number;
  message: string;
};

type DeviceLog = {
  device: Device;
  method: 'log' | 'error' | 'warn';
  payload: Array<unknown>;
};

type Params = {
  id?: string;
  platform?: Platform;
  sdkVersion?: SDKVersion;
  username?: string;
  projectName?: string;
};

type Props = AuthProps & {
  snack?: Snack;
  history: {
    push: (props: { pathname: string; search: string }) => void;
  };
  match: {
    params: Params;
  };
  location: {
    search: string;
  };
  query: QueryParams;
  userAgent: string;
  isEmbedded?: boolean;
  initialCode: ExpoSnackFiles | string;
};

type SnackSessionState = {
  name: string;
  description: string;
  files: ExpoSnackFiles;
  dependencies: { [key: string]: { version: string } };
  sdkVersion: SDKVersion;
  isSaved: boolean;
  isResolving: boolean;
  loadingMessage: string | undefined;
};

type State = {
  snackSessionState: SnackSessionState;
  snackSessionReady: boolean;
  channel: string;
  deviceId: string;
  sendCodeOnChangeEnabled: boolean;
  autosaveEnabled: boolean;
  isSavedOnce: boolean;
  saveHistory: SaveHistory;
  saveStatus: SaveStatus;
  params: Params;
  fileEntries: FileSystemEntry[];
  connectedDevices: Device[];
  deviceError: DeviceError | undefined;
  deviceLogs: DeviceLog[];
  isPreview: boolean;
  wasUpgraded: boolean;
  initialSdkVersion: SDKVersion;
};

type Listener = ReturnType<typeof persist>;

type SnackSessionProxy = {
  create: (options: SnackSessionOptions) => Promise<void>;
  session: {
    expoApiUrl: string;
    snackagerUrl: string;
    snackagerCloudfrontUrl: string;
    host: string;
    startAsync: () => Promise<void>;
    saveAsync: (options: {
      isDraft?: boolean;
    }) => Promise<{
      id: string;
    }>;
    uploadAssetAsync: (asset: File) => Promise<string>;
    syncDependenciesAsync: (
      modules: {
        [name: string]: string | undefined;
      },
      callback: Listener
    ) => Promise<void>;
    sendCodeAsync: (payload: ExpoSnackFiles) => Promise<void>;
    reloadSnack: () => Promise<void>;
    setSdkVersion: (version: SDKVersion) => Promise<void>;
    setUser: (user: { sessionSecret: string | undefined }) => Promise<void>;
    setName: (name: string) => Promise<void>;
    setDescription: (description: string) => Promise<void>;
    setDeviceId: (id: string) => Promise<void>;
    getState: () => Promise<SnackSessionState>;
    getChannel: () => Promise<string>;
  };
  addStateListener: (listener: Listener) => Promise<void>;
  addPresenceListener: (listener: Listener) => Promise<void>;
  addErrorListener: (listener: Listener) => Promise<void>;
  addLogListener: (listener: Listener) => Promise<void>;
  setDependencyErrorListener: (listener: Listener) => Promise<void>;
};

type SaveOptions = {
  isDraft?: boolean;
  allowedOnProfile?: boolean;
};

class Main extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const usingDefaultCode =
      props.initialCode === DEFAULT_CODE &&
      !((props.snack && props.snack.code) || (props.query && props.query.code));

    let name = getSnackName();
    let description = DEFAULT_DESCRIPTION;
    // TODO(satya164): is this correct? we don't match for sdkVersion in the router
    let sdkVersion = props.match.params.sdkVersion || DEFAULT_SDK_VERSION;
    let dependencies = usingDefaultCode ? DEFAULT_DEPENDENCIES : {};

    let code: ExpoSnackFiles | string =
      props.snack && props.snack.code ? props.snack.code : props.initialCode;

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

    const initialSdkVersion = sdkVersion;

    let wasUpgraded = false;

    if (!versions.hasOwnProperty(sdkVersion)) {
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

    const isPreview = !!(
      isMobile(this.props.userAgent) &&
      (props.match.params.id || props.match.params.projectName) &&
      !props.isEmbedded
    );

    const fileEntries = snackToEntryArray(code);

    const params: Params = {
      platform: props.query.platform,
      sdkVersion: props.query.sdkVersion,
      ...(!props.match.params.id && props.match.params.username && props.match.params.projectName
        ? { id: `@${props.match.params.username}/${props.match.params.projectName}` }
        : null),
    };

    // Create an initial snack session state from the data we have
    // After the worker is created, it'll be replaced with uptodate data
    const snackSessionState: SnackSessionState = {
      name,
      description,
      files: code,
      dependencies,
      sdkVersion,
      isSaved: Boolean(params.id),
      isResolving: false,
      loadingMessage: undefined,
    };

    this.state = {
      snackSessionState,
      snackSessionReady: false,
      sendCodeOnChangeEnabled: true,
      // We don't have any UI for autosave in embed
      // In addition, enabling autosave in embed will disable autosave in editor when embed dialog is open
      autosaveEnabled: !this.props.isEmbedded,
      isSavedOnce: false,
      saveHistory: props.snack && props.snack.history ? props.snack.history : [],
      saveStatus:
        props.snack && props.snack.isDraft ? 'saved-draft' : params.id ? 'published' : 'changed',
      fileEntries: [...fileEntries, this._getPackageJson(snackSessionState)],
      connectedDevices: [],
      deviceLogs: [],
      deviceError: undefined,
      channel: '',
      deviceId: '',
      isPreview,
      params,
      wasUpgraded,
      initialSdkVersion,
    };
  }

  componentDidMount() {
    if (window.location.host.includes('expo.io')) {
      Raven.config('https://6501f7d527764d85b045b0ce31927c75@sentry.io/191351').install();
      const build_date = new Date(process.env.BUILD_TIMESTAMP || 0).toUTCString();
      Raven.setTagsContext({ build_date });
      Segment.getInstance().identify({ build_date });
    }

    if (this.state.wasUpgraded) {
      Segment.getInstance().logEvent('LOADED_UNSUPPORTED_VERSION', {
        requestedVersion: this.state.initialSdkVersion,
        snackId: this.props.match.params.id,
      });
    }

    // @ts-ignore
    this._snackSessionWorker = new Worker('../workers/snack-session.worker', { type: 'module' });
    this._snack = create(this._snackSessionWorker);

    this._initializeSnackSession();

    this._broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME, {
      webWorkerSupport: false,
    });

    // Let other tabs know that a new tab is opened
    this._broadcastChannel.postMessage({
      type: 'NEW_TAB',
      id: this.state.params.id,
    });

    // Listen to messages from other tabs
    this._broadcastChannel.addEventListener('message', e => {
      const { id } = this.state.params;

      // Only respond to messages which have the same snack
      if (e.id !== id || !e.id) {
        return;
      }

      switch (e.type) {
        case 'NEW_TAB':
          {
            let autosaveEnabled;

            if (this.state.isSavedOnce) {
              autosaveEnabled = this.state.autosaveEnabled;
            } else {
              // If we have never saved in this tab, disable autosave in this tab
              // It allows the user to autosave in the new tab which is more covenient
              this.setState({
                autosaveEnabled: false,
              });

              autosaveEnabled = false;
            }

            // If another tab with same snack is opened,
            // Let it know that there's a duplicate tab
            this._broadcastChannel.postMessage({
              type: 'DUPLICATE_TAB',
              id,
              autosaveEnabled,
            });
          }
          break;
        case 'DUPLICATE_TAB':
          // If there's a duplicate tab, and it has autosave enabled,
          // Disable autosave in the current tab
          if (e.autosaveEnabled) {
            this.setState({ autosaveEnabled: false });
          }

          break;
      }
    });
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (this.state.fileEntries === prevState.fileEntries) {
      return;
    }

    let didFilesChange = false;

    if (this.state.fileEntries.length !== prevState.fileEntries.length) {
      didFilesChange = true;
    } else {
      const items: { [key: string]: FileSystemEntry['item'] } = prevState.fileEntries.reduce(
        (acc: { [key: string]: FileSystemEntry['item'] }, { item }) => {
          acc[item.path] = item;
          return acc;
        },
        {}
      );

      didFilesChange = this.state.fileEntries.some(
        ({ item }) => !item.virtual && items[item.path] !== item
      );
    }

    if (didFilesChange) {
      if (this.state.sendCodeOnChangeEnabled) {
        this._sendCode();
      }

      this._handleSaveDraft();
    }
  }

  componentWillUnmount() {
    this._snackSessionWorker && this._snackSessionWorker.terminate();
    this._snackSessionDependencyErrorListener &&
      this._snackSessionDependencyErrorListener.dispose();
    this._snackSessionLogListener && this._snackSessionLogListener.dispose();
    this._snackSessionErrorListener && this._snackSessionErrorListener.dispose();
    this._snackSessionPresenceListener && this._snackSessionPresenceListener.dispose();
    this._snackSessionStateListener && this._snackSessionStateListener.dispose();

    this._broadcastChannel.close();
  }

  _initializeSnackSession = async () => {
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

    await this._snack.create({
      verbose: false,
      snackId: !wasUpgraded ? params.id : undefined,
      files: snackSessionState.files,
      name: snackSessionState.name,
      description: snackSessionState.description,
      sdkVersion: snackSessionState.sdkVersion,
      dependencies: snackSessionState.dependencies,
      user: { idToken: Auth.currentIdToken, sessionSecret: Auth.currentSessionSecret },
      deviceId,
    });

    this._snack.session.expoApiUrl = nullthrows(process.env.API_SERVER_URL);

    const isLocal = window.location.host.includes('expo.test');
    const isStaging = window.location.host.includes('staging');

    if (isStaging) {
      this._snack.session.host = 'staging.expo.io';
    } else if (isLocal) {
      this._snack.session.host = constants.ngrok;
    }

    if (this.props.query.local_snackager === 'true') {
      this._snack.session.snackagerUrl = 'http://localhost:3001';
      this._snack.session.snackagerCloudfrontUrl = 'https://ductmb1crhe2d.cloudfront.net';
    } else if (isStaging) {
      this._snack.session.snackagerUrl = 'https://staging.snackager.expo.io';
      this._snack.session.snackagerCloudfrontUrl = 'https://ductmb1crhe2d.cloudfront.net';
    }

    const sessionSecret = this.props.getSessionSecret();

    if (sessionSecret) {
      await this._snack.session.setUser({ sessionSecret });
    }

    // Add the listeners
    this._snackSessionDependencyErrorListener = persist(this._handleSnackDependencyError);
    this._snackSessionLogListener = persist(this._handleSnackSessionLog);
    this._snackSessionErrorListener = persist(this._handleSnackSessionError);
    this._snackSessionPresenceListener = persist(this._handleSnackSessionPresence);
    this._snackSessionStateListener = persist(this._handleSnackSessionState);

    this._snack.setDependencyErrorListener(this._snackSessionDependencyErrorListener);
    this._snack.addLogListener(this._snackSessionLogListener);
    this._snack.addErrorListener(this._snackSessionErrorListener);
    this._snack.addPresenceListener(this._snackSessionPresenceListener);
    this._snack.addStateListener(this._snackSessionStateListener);

    await this._snack.session.startAsync();

    const channel = await this._snack.session.getChannel();
    const sessionState = await this._snack.session.getState();

    this.setState({
      channel,
      snackSessionState: sessionState,
      snackSessionReady: true,
    });

    Segment.getInstance().setCommonData({
      snackId: this.state.params.id,
      isEmbedded: this.props.isEmbedded || false,
    });
    Segment.getInstance().logEvent('LOADED_SNACK', {
      sdkVersion: this.state.snackSessionState.sdkVersion,
    });
  };

  _previewRef = React.createRef<Window>();
  _snack: SnackSessionProxy = undefined as any;
  _snackSessionWorker: Worker = undefined as any;
  _snackSessionDependencyErrorListener: Listener | undefined;
  _snackSessionLogListener: Listener | undefined;
  _snackSessionErrorListener: Listener | undefined;
  _snackSessionPresenceListener: Listener | undefined;
  _snackSessionStateListener: Listener | undefined;

  _broadcastChannel: BroadcastChannel = undefined as any;

  _handleSnackDependencyError = (error: string) => Raven.captureMessage(error);

  _handleToggleSendCode = () =>
    this.setState(state => ({ sendCodeOnChangeEnabled: !state.sendCodeOnChangeEnabled }));

  _handleSnackSessionLog = (payload: {
    device: Device;
    method: 'log' | 'error' | 'warn';
    arguments: Array<unknown>;
  }) => {
    const deviceLog = {
      device: payload.device,
      method: payload.method,
      payload: payload.arguments,
    };

    this.setState(state => ({
      deviceLogs: [...state.deviceLogs.slice(-99), deviceLog],
    }));
  };

  _handleSnackSessionError = (
    errors: Array<{ message: string; startLine?: number; startColumn?: number }>
  ) => {
    let deviceError: DeviceError | undefined;

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
  };

  _handleSnackSessionPresence = (presence: { status: 'join' | 'leave'; device: Device }) => {
    if (presence.status === 'join') {
      this.setState(state => ({
        connectedDevices: [...state.connectedDevices, presence.device],
        deviceError: undefined,
      }));
    } else if (presence.status === 'leave') {
      this.setState(state => ({
        connectedDevices: state.connectedDevices.filter(device => device.id !== presence.device.id),
        deviceError: undefined,
      }));
    }
  };

  _handleSnackSessionState = (snackSessionState: SnackSessionState) => {
    this.setState({ snackSessionState });
  };

  _sendCodeNotDebounced = () =>
    this._snack.session.sendCodeAsync(
      // map state.fileEntries to the correct type before sending to snackSession

      entryArrayToSnack(this.state.fileEntries.filter(e => !e.item.virtual))
    );

  _sendCode = debounce(this._sendCodeNotDebounced, 1000);

  _reloadSnack = () => this._snack.session.reloadSnack();

  _getPackageJson = (snackSessionState: SnackSessionState): TextFileEntry => ({
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

  _handleSubmitMetadata = async (
    details: {
      name: string;
      description: string;
    },
    draft: boolean = true
  ) => {
    const { name, description = '' } = this.state.snackSessionState;

    if (name === details.name && description === details.description) {
      return;
    }

    this.setState({ saveStatus: 'changed' });

    await this._snack.session.setName(details.name);
    await this._snack.session.setDescription(details.description);

    if (draft) {
      this._handleSaveDraftNotDebounced();
    }
  };

  _handleChangeCode = (content: string) =>
    this.setState((state: State) => ({
      saveStatus: 'changed',
      fileEntries: state.fileEntries.map(entry => {
        if (entry.item.type === 'file' && entry.state.isFocused) {
          return updateEntry(entry, { item: { content } });
        }
        return entry;
      }),
      deviceError: undefined,
    }));

  _handleFileEntriesChange = (nextFileEntries: FileSystemEntry[]): Promise<void> => {
    return new Promise(resolve =>
      this.setState(state => {
        const previousFocusedEntry = this._findFocusedEntry(state.fileEntries);
        const nextFocusedEntry = this._findFocusedEntry(nextFileEntries);

        let fileEntries = nextFileEntries;

        if (
          // Don't update package.json if we're resolving
          !state.snackSessionState.isResolving &&
          // Update package.json when it's focused again instead of everytime deps change
          // This avoids changing it while you're still editing the file
          nextFocusedEntry &&
          isPackageJson(nextFocusedEntry.item.path) &&
          (previousFocusedEntry ? !isPackageJson(previousFocusedEntry.item.path) : true)
        ) {
          fileEntries = fileEntries.map(entry =>
            isPackageJson(entry.item.path)
              ? updateEntry(this._getPackageJson(state.snackSessionState), {
                  // @ts-ignore
                  state: entry.state,
                })
              : entry
          );
        }

        return { fileEntries };
      }, resolve)
    );
  };

  _handleChangeSDKVersion = async (sdkVersion: SDKVersion) => {
    await this._snack.session.setSdkVersion(sdkVersion);

    this._handleSaveDraftNotDebounced();
  };

  _handleClearDeviceLogs = () =>
    this.setState({
      deviceLogs: [],
    });

  // TODO: better way of getting snack id
  _handleDownloadAsync = async () => {
    // Already check if Snack is saved in EditorView.js
    const snackId = this.state.params.id;

    // this shouldn't happen
    if (!snackId) {
      return;
    }

    const url = `${process.env.API_SERVER_URL}/--/api/v2/snack/download/${snackId}`;

    // Simulate link click to download file
    const element = document.createElement('a');
    if (element && document.body) {
      document.body.appendChild(element);
      element.setAttribute('href', url);
      element.setAttribute('download', 'snack.zip');
      element.style.display = '';
      element.click();

      document.body.removeChild(element);
    }
  };

  _handlePublishAsync = async (options: SaveOptions) => {
    // Send updated code first
    this._sendCodeNotDebounced();

    const cntCodeFile = this.state.fileEntries.filter(
      entry => entry.item && entry.item.type === 'file' && !entry.item.asset
    ).length;
    const cntAssetFile = this.state.fileEntries.filter(
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

    await this._saveSnack(options);

  };

  _handleSaveDraftNotDebounced = () => {
    if (this.props.viewer) {
      // We can save draft only if the user is logged in
      this._saveSnack({ isDraft: true, allowedOnProfile: true });
    }
  };

  _handleSaveDraft = debounce(this._handleSaveDraftNotDebounced, 3000);

  _saveSnack = async (options: SaveOptions = {}) => {
    if (options.isDraft && !this.state.autosaveEnabled) {
      return;
    }

    this.setState({ saveStatus: options.isDraft ? 'saving-draft' : 'publishing' });

    try {
      if (options.allowedOnProfile) {
        await this._updateUser();
      } else {
        await this._snack.session.setUser({ sessionSecret: undefined });
      }

      const saveResult = await this._snack.session.saveAsync(options);

      this.props.history.push({
        pathname: `/${saveResult.id}`,
        search: this.props.location.search,
      });

      this.setState(state => ({
        isSavedOnce: true,
        saveHistory: [
          { id: saveResult.id, savedAt: new Date().toISOString(), isDraft: options.isDraft },
          ...state.saveHistory,
        ],
        saveStatus: options.isDraft ? 'saved-draft' : 'published',
        params: {
          ...state.params,
          id: saveResult.id,
        },
      }));
    } catch (e) {
      this.setState({ saveStatus: 'changed' });
    }
  };

  _updateUser = async () => {
    const sessionSecret = this.props.getSessionSecret();

    if (sessionSecret) {
      await this._snack.session.setUser({ sessionSecret });
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

    this._snack.session.setDeviceId(deviceId);
  };

  _findFocusedEntry = (entries: FileSystemEntry[]): TextFileEntry | AssetFileEntry | undefined =>
    // @ts-ignore
    entries.find(({ item, state }) => item.type === 'file' && state.isFocused === true);

  _handleOpenEditor = () => this.setState({ isPreview: false });

  _uploadAssetAsync = (asset: File) => this._snack.session.uploadAssetAsync(asset);

  _syncDependenciesAsync = async (
    dependencies: { [key: string]: string | undefined },
    onError: (name: string, e: Error) => void
  ) => {
    const didDependeciesChange = !isEqual(
      mapValues(this.state.snackSessionState.dependencies, o => o.version),
      dependencies
    );

    const errorListener = persist(onError);

    try {
      await this._snack.session.syncDependenciesAsync(dependencies, errorListener);

      if (didDependeciesChange) {
        this._handleSaveDraftNotDebounced();
      }
    } finally {
      errorListener.dispose();
    }
  };

  render() {
    const title =
      this.props.snack && this.props.snack.manifest ? this.props.snack.manifest.name : null;

    if (this.state.isPreview) {
      return (
        <AppDetails
          name={this.state.snackSessionState.name}
          description={this.state.snackSessionState.description}
          channel={this.state.channel}
          snackId={this.state.params.id}
          sdkVersion={this.state.snackSessionState.sdkVersion}
          onOpenEditor={this._handleOpenEditor}
          userAgent={this.props.userAgent}
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
            loaded && Comp && this.state.snackSessionReady ? (
              <Comp
                previewRef={this._previewRef}
                snack={this.props.snack}
                createdAt={this.props.snack ? this.props.snack.created : undefined}
                autosaveEnabled={this.state.autosaveEnabled}
                channel={this.state.channel}
                connectedDevices={this.state.connectedDevices}
                createdAt={this.props.snack ? this.props.snack.created : undefined}
                creatorUsername={this.state.params.username}
                dependencies={this.state.snackSessionState.dependencies}
                dependencyQueryParam={this.props.query.dependencies}
                description={this.state.snackSessionState.description}
                deviceError={this.state.deviceError}
                deviceId={this.state.deviceId}
                deviceLogs={this.state.deviceLogs}
                entry={this._findFocusedEntry(this.state.fileEntries)}
                fileEntries={this.state.fileEntries}
                initialSdkVersion={this.state.initialSdkVersion}
                isResolving={this.state.snackSessionState.isResolving}
                loadingMessage={this.state.snackSessionState.loadingMessage}
                name={this.state.snackSessionState.name}
                onChangeCode={this._handleChangeCode}
                onChangeSDKVersion={this._handleChangeSDKVersion}
                onClearDeviceLogs={this._handleClearDeviceLogs}
                onDownloadAsync={this._handleDownloadAsync}
                onFileEntriesChange={this._handleFileEntriesChange}
                onPublishAsync={this._handlePublishAsync}
                onReloadSnack={this._reloadSnack}
                onSendCode={this._sendCodeNotDebounced}
                onSignIn={this._updateUser}
                onSubmitMetadata={this._handleSubmitMetadata}
                onToggleSendCode={this._handleToggleSendCode}
                params={this.state.params}
                previewRef={this._previewRef}
                query={this.props.query}
                saveHistory={this.state.saveHistory}
                saveStatus={this.state.saveStatus}
                sdkVersion={this.state.snackSessionState.sdkVersion}
                sendCodeOnChangeEnabled={this.state.sendCodeOnChangeEnabled}
                sessionID={this.props.query.session_id}
                setDeviceId={this._setDeviceId}
                snack={this.props.snack}
                supportedPlatformsQueryParam={this.props.query.supportedPlatforms}
                syncDependenciesAsync={this._syncDependenciesAsync}
                uploadFileAsync={this._uploadAssetAsync}
                userAgent={this.props.userAgent}
                wasUpgraded={this.state.wasUpgraded}
              />
            ) : this.props.isEmbedded ? (
              <EmbeddedShell />
            ) : (
              <AppShell title={title} />
            )
          }
        </LazyLoad>
      );
    }
  }
}

const MainContainer = connect((state: any) => ({
  viewer: state.viewer,
}))(withAuth(Main));

/**
 * Fetch code from a remote source (if provided) before rendering the main app
 */
export default class App extends React.Component<Props, any> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isReady: !(props.query && props.query.sourceUrl),
      initialCode: DEFAULT_CODE,
    };
  }

  componentDidMount() {
    if (this.props.query.sourceUrl) {
      this._loadSourceAsync(this.props.query.sourceUrl);
    }
  }

  _loadSourceAsync = async (url: string) => {
    // Minimum amount of time to show the loading indicator for, so it doesn't
    // just flicker in and out
    const MIN_LOADING_MS = 1500;

    try {
      let fetchStartTimeMs = Date.now();
      let response = await fetch(url);
      let code = await response.text();

      let fetchDurationMs = Date.now() - fetchStartTimeMs;
      let delayBeforeHidingMs =
        fetchDurationMs < MIN_LOADING_MS ? MIN_LOADING_MS - fetchDurationMs : 0;

      setTimeout(() => {
        this.setState({
          isReady: true,
          initialCode: code,
        });
      }, delayBeforeHidingMs);
    } catch (e) {
      alert(`We were unable to load source from ${url}.`);
      this.setState({
        isReady: true,
      });
    }
  };

  render() {
    if (this.state.isReady) {
      return <MainContainer {...this.props} initialCode={this.state.initialCode} />;
    } else {
      return (
        <div className={css(styles.container)}>
          <div className={css(styles.logo)}>
            <AnimatedLogo />
          </div>
          <p className={css(styles.loadingText)}>Loading code from external source...</p>
        </div>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    display: 'flex',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    transform: 'scale(0.5)',
    opacity: 0.9,
  },
  loadingText: {
    marginTop: 0,
    opacity: 0.7,
    fontSize: 18,
  },
});
