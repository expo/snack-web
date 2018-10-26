/* @flow */

import * as React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, css } from 'aphrodite';
import shortid from 'shortid';

import OpenWithExpoButton from './shared/OpenWithExpoButton';
import LazyLoad from './shared/LazyLoad';

import EmbeddedToolbarShell from './Shell/EmbeddedToolbarShell';
import PageMetadata from './PageMetadata';
import EmbeddedEditorTitle from './EmbeddedEditorTitle';
import EmbeddedEditorFooter from './EmbeddedEditorFooter';
import DependencyManager from './DependencyManager';
import DeviceInstructionsModal, {
  type EmbeddedConnectionMethod,
  type ConnectionMethod,
} from './DeviceInstructions/DeviceInstructionsModal';
import SimpleEditor from './Editor/SimpleEditor';

import colors from '../configs/colors';

import FeatureFlags from '../utils/FeatureFlags';
import { isMobile } from '../utils/detectPlatform';
import type { TextFileEntry, FileSystemEntry, QueryParams } from '../types';
import type { SDKVersion } from '../configs/sdk';

import withThemeName, { type ThemeName } from './Preferences/withThemeName';

const SESSION_ID = `snack-session-${shortid()}`;

type Props = {|
  entry: TextFileEntry,
  name: string,
  description: string,
  params: {
    id?: string,
  },
  channel: string,
  isResolving: boolean,
  loadingMessage?: string,
  fileEntries: FileSystemEntry[],
  initialSdkVersion: SDKVersion,
  sdkVersion: SDKVersion,
  onFileEntriesChange: (entries: FileSystemEntry[]) => Promise<void>,
  onChangeCode: (code: string) => void,
  query: QueryParams,
  dependencies: { [name: string]: { version: string } },
  syncDependenciesAsync: (
    modules: { [name: string]: ?string },
    onError: (name: string, e: Error) => mixed
  ) => Promise<void>,
  setDeviceId: (deviceId: string) => Promise<void>,
  deviceId: ?string,
  wasUpgraded: boolean,
  testConnectionMethod?: ConnectionMethod,
  userAgent: string,
  theme: ThemeName,
|};

type State = {|
  devicePreviewShown: boolean,
  devicePreviewPlatform: 'android' | 'ios',
  deviceConnectionMethod: EmbeddedConnectionMethod,
  currentModal: 'device-instructions' | null,
|};

class EmbeddedEditorView extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    let deviceConnectionMethod = this.props.testConnectionMethod || 'device-id';
    if (deviceConnectionMethod === 'account') {
      deviceConnectionMethod = 'qr-code';
    }

    this.state = {
      devicePreviewShown: props.query.preview !== 'false',
      devicePreviewPlatform: props.query.platform === 'ios' ? 'ios' : 'android',
      deviceConnectionMethod,
      currentModal: null,
    };
  }

  _handleShowDeviceInstructions = () => {
    this.setState({ currentModal: 'device-instructions' });
  };

  _handleHideModal = () => {
    this.setState({ currentModal: null });
  };

  _handleOpenFullView = () => {
    try {
      localStorage.setItem(
        SESSION_ID,
        JSON.stringify({
          code: this.props.entry.item.content,
          platform: this.props.query.platform,
        })
      );
    } catch (e) {
      // probably localStorage is full
      // or we are in incognito in Safari
    }
  };

  _toggleDevicePreview = () =>
    this.setState(state => ({
      devicePreviewShown: !state.devicePreviewShown,
    }));

  _changeDevicePreviewPlatform = (platform: 'ios' | 'android') =>
    this.setState({
      devicePreviewPlatform: platform,
    });

  _changeConnectionMethod = (method: EmbeddedConnectionMethod) =>
    this.setState({
      deviceConnectionMethod: method,
    });

  render() {
    const { devicePreviewShown, devicePreviewPlatform } = this.state;

    const {
      name,
      description,
      channel,
      entry,
      params,
      isResolving,
      loadingMessage,
      theme,
    } = this.props;

    return (
      <main
        className={css(
          styles.container,
          theme === 'light' ? styles.backgroundLight : styles.backgroundDark
        )}>
        <PageMetadata name={name} description={description} params={params} />
        <EmbeddedToolbarShell>
          <EmbeddedEditorTitle
            name={name}
            description={description}
            sessionID={SESSION_ID}
            onOpenFullview={this._handleOpenFullView}
          />
          <a
            href="https://expo.io"
            target="_blank"
            rel="noopener noreferrer"
            className={css(styles.logo)}>
            <img
              className={css(styles.wordmark)}
              src={
                theme === 'light'
                  ? require('../assets/expo-wordmark.png')
                  : require('../assets/expo-wordmark-light.png')
              }
            />
          </a>
        </EmbeddedToolbarShell>
        <div className={css(styles.editorArea)}>
          <SimpleEditor
            path={entry.item.path}
            value={entry.item.content}
            onValueChange={this.props.onChangeCode}
            lineNumbers="off"
          />
          {devicePreviewShown ? (
            <LazyLoad load={() => import(/* webpackPreload: true */ './DevicePreview')}>
              {({ loaded, data: Comp }) => {
                if (!loaded) {
                  return null;
                }

                return (
                  <Comp
                    screenOnly
                    channel={channel}
                    snackId={params.id}
                    sdkVersion={this.props.sdkVersion}
                    platform={devicePreviewPlatform}
                    className={css(styles.preview)}
                    payerCode={this.props.query.appetizePayerCode}
                    onClickRunOnPhone={this._handleShowDeviceInstructions}
                    canUserAuthenticate={false}
                    wasUpgraded={this.props.wasUpgraded}
                    previewQueue="secondary"
                  />
                );
              }}
            </LazyLoad>
          ) : null}
        </div>
        <DeviceInstructionsModal
          large
          isEmbedded
          visible={this.state.currentModal === 'device-instructions'}
          onDismiss={this._handleHideModal}
          sdkVersion={this.props.sdkVersion}
          onChangeMethod={this._changeConnectionMethod}
          method={this.state.deviceConnectionMethod}
          channel={this.props.channel}
          snackId={this.props.params.id}
          setDeviceId={this.props.setDeviceId}
          deviceId={this.props.deviceId}
        />
        <div className={css(styles.footer)}>
          <EmbeddedEditorFooter
            isResolving={isResolving}
            loadingMessage={loadingMessage}
            devicePreviewShown={devicePreviewShown}
            devicePreviewPlatform={devicePreviewPlatform}
            onToggleDevicePreview={this._toggleDevicePreview}
            onChangeDevicePreviewPlatform={this._changeDevicePreviewPlatform}
          />
        </div>
        {isMobile(this.props.userAgent) ? (
          <div className={css(styles.button)}>
            <OpenWithExpoButton
              sdkVersion={this.props.sdkVersion}
              channel={channel}
              snackId={this.props.params.id}
            />
          </div>
        ) : null}
        {FeatureFlags.isAvailable('PROJECT_DEPENDENCIES', this.props.sdkVersion) ? (
          <DependencyManager
            fileEntries={this.props.fileEntries}
            onEntriesChange={this.props.onFileEntriesChange}
            initialSdkVersion={this.props.initialSdkVersion}
            sdkVersion={this.props.sdkVersion}
            dependencies={this.props.dependencies}
            syncDependenciesAsync={this.props.syncDependenciesAsync}
            onOpenFullView={this._handleOpenFullView}
            sessionID={SESSION_ID}
          />
        ) : null}
      </main>
    );
  }
}

export default withThemeName(
  connect((state, props) => ({
    testConnectionMethod: state.splitTestSettings.defaultConnectionMethod,
  }))(EmbeddedEditorView)
);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: colors.background.light,
    color: colors.text.light,
    minHeight: 0, // Without this firefox doesn't shrink content
  },

  backgroundLight: {
    backgroundColor: colors.background.light,
    color: colors.text.light,
  },

  backgroundDark: {
    backgroundColor: colors.background.dark,
    color: colors.text.dark,
  },

  editorArea: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    minHeight: 0, // Without this firefox doesn't shrink content
  },

  editorPlaceholder: {
    display: 'flex',
    flex: 1,
  },

  preview: {
    backgroundColor: 'black',
  },

  logo: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    color: '#999',
    textDecoration: 'none',
    whiteSpace: 'nowrap',

    '@media (max-width: 480px)': {
      display: 'none',
    },
  },

  wordmark: {
    height: 18,
    margin: '0 .75em',
  },

  footer: {
    '@media (max-width: 480px)': {
      display: 'none',
    },
  },

  button: {
    backgroundColor: colors.background.light,
    borderTop: `1px solid ${colors.border}`,
    padding: '.5em',

    '@media (min-width: 480px)': {
      display: 'none',
    },
  },
});
