import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import ToggleSwitch from './shared/ToggleSwitch';
import LoadingText from './shared/LoadingText';
import FooterShell from './Shell/FooterShell';
import SDKVersionSwitcher from './SDKVersionSwitcher';
import FooterButton from './shared/FooterButton';
import MenuButton from './shared/MenuButton';
import colors from '../configs/colors';
import { Annotation } from '../utils/convertErrorToAnnotation';
import { SDKVersion } from '../configs/sdk';
import { c } from './ColorsProvider';

type Props = {
  loadingMessage: string | undefined;
  annotations: Annotation[];
  connectedDevices: Array<{
    name: string;
    id: string;
    platform: string;
  }>;
  fileTreeShown: boolean;
  editorMode: 'vim' | 'normal';
  devicePreviewShown: boolean;
  sdkVersion: SDKVersion;
  onToggleTheme: () => void;
  onTogglePanels: () => void;
  onToggleFileTree: () => void;
  onToggleDevicePreview: () => void;
  onToggleVimMode?: () => void;
  onChangeSDKVersion: (sdkVersion: SDKVersion) => void;
  onPrettifyCode: () => void;
  theme: string;
};

export default function Footer(props: Props) {
  const {
    loadingMessage,
    annotations,
    connectedDevices,
    fileTreeShown,
    devicePreviewShown,
    editorMode,
    sdkVersion,
    onToggleTheme,
    onTogglePanels,
    onToggleFileTree,
    onToggleDevicePreview,
    onToggleVimMode,
    onChangeSDKVersion,
    onPrettifyCode,
    theme,
  } = props;

  const isErrorFatal = annotations.some(a => a.severity > 3);
  const isLoading = Boolean(loadingMessage);

  return (
    <FooterShell type={isErrorFatal && !isLoading ? 'error' : isLoading ? 'loading' : null}>
      <div className={css(styles.left)}>
        {isLoading ? (
          <LoadingText className={css(styles.loadingText)}>{loadingMessage}</LoadingText>
        ) : (
          <button
            onClick={onTogglePanels}
            className={css(
              styles.statusText,
              annotations.length
                ? isErrorFatal
                  ? styles.errorTextFatal
                  : styles.errorText
                : styles.successText
            )}>
            {annotations.length
              ? `${annotations[0].source}: ${annotations[0].message.split('\n')[0]}` +
                (annotations.length > 1 ? ` (+${annotations.length - 1} more)` : '')
              : 'No errors'}
          </button>
        )}
      </div>
      <FooterButton icon={require('../assets/prettify-icon.png')} onClick={onPrettifyCode}>
        <span className={css(styles.buttonLabel)}>Prettier</span>
      </FooterButton>
      <MenuButton
        icon={require('../assets/settings-icon.png')}
        label={<span className={css(styles.buttonLabel)}>Editor</span>}
        content={
          <React.Fragment>
            <ToggleSwitch checked={fileTreeShown} onChange={onToggleFileTree} label="Files" />
            <ToggleSwitch checked={theme !== 'light'} onChange={onToggleTheme} label="Dark theme" />
            {onToggleVimMode ? (
              <ToggleSwitch checked={editorMode === 'vim'} onChange={onToggleVimMode} label="Vim" />
            ) : null}
          </React.Fragment>
        }
      />
      <SDKVersionSwitcher sdkVersion={sdkVersion} onChange={onChangeSDKVersion} />
      <MenuButton
        icon="none"
        label={
          <React.Fragment>
            <span className={css(styles.buttonLabel)}>Devices</span>
            <span className={css(styles.devicesCount)}>{connectedDevices.length}</span>
          </React.Fragment>
        }
        content={
          connectedDevices.length ? (
            connectedDevices.map(device => (
              <div
                key={device.id}
                className={css(
                  styles.deviceLabel,
                  device.platform === 'ios' ? styles.deviceLabelIOS : styles.deviceLabelAndroid
                )}>
                {device.name}
              </div>
            ))
          ) : (
            <div className={css(styles.noDevicesMessage)}>No devices connected</div>
          )
        }
      />
      <ToggleSwitch checked={devicePreviewShown} onChange={onToggleDevicePreview} label="Preview" />
    </FooterShell>
  );
}

const styles = StyleSheet.create({
  left: {
    display: 'flex',
    alignItems: 'stretch',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },

  loadingText: {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '.5em',
  },

  statusText: {
    border: 0,
    outline: 0,
    margin: 0,
    appearance: 'none',
    backgroundColor: 'transparent',
    backgroundSize: 16,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '1em center',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '.25em .5em .25em 3em',
    minWidth: 200,
    width: '100%',
    textAlign: 'left',
  },

  successText: {
    backgroundImage: `url(${require('../assets/checkmark.png')})`,
  },

  errorText: {
    backgroundImage: `url(${require('../assets/cross-red.png')})`,
    color: colors.error,
  },

  errorTextFatal: {
    backgroundImage: `url(${require('../assets/cross-light.png')})`,
  },

  devicesCount: {
    position: 'absolute',
    top: 4,
    right: 4,
    height: 20,
    minWidth: 20,
    borderRadius: '50%',
    backgroundColor: c('text'),
    color: c('background'),
    opacity: 0.5,
  },

  deviceLabel: {
    whiteSpace: 'nowrap',
    padding: '8px 16px 8px 42px',
    backgroundSize: 16,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '16px center',
  },

  deviceLabelIOS: {
    backgroundImage: `url(${require('../assets/ios-icon.png')})`,
  },

  deviceLabelAndroid: {
    backgroundImage: `url(${require('../assets/android-icon.png')})`,
  },

  noDevicesMessage: {
    whiteSpace: 'nowrap',
    margin: '8px 16px',
  },

  buttonLabel: {
    display: 'none',

    '@media (min-width: 720px)': {
      display: 'inline',
    },
  },
});
