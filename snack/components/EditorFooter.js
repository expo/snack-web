/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import ToggleSwitch from './shared/ToggleSwitch';
import ToggleButtons from './shared/ToggleButtons';
import LoadingText from './shared/LoadingText';
import FooterShell from './Shell/FooterShell';
import SDKVersionSwitcher from './SDKVersionSwitcher';
import colors from '../configs/colors';
import withThemeName, { type ThemeName } from './Preferences/withThemeName';

import type { Annotation } from '../utils/convertErrorToAnnotation';
import type { SDKVersion } from '../configs/sdk';

type Props = {|
  loadingMessage: ?string,
  annotations: Annotation[],
  connectedDevices: Array<{| name: string, id: string, platform: string |}>,
  fileTreeShown: boolean,
  editorMode: 'vim' | 'normal',
  devicePreviewShown: boolean,
  devicePreviewPlatform: 'android' | 'ios',
  sdkVersion: SDKVersion,
  onToggleTheme: Function,
  onTogglePanels: Function,
  onToggleFileTree: Function,
  onToggleDevicePreview: Function,
  onToggleVimMode?: Function,
  onChangeDevicePreviewPlatform: Function,
  onChangeSDKVersion: Function,
  onPrettifyCode: Function,
  theme: ThemeName,
|};

type State = {|
  moreVisible: boolean,
|};

class EditorFooter extends React.PureComponent<Props, State> {
  state: State = {
    moreVisible: false,
  };

  _handleToggleMore = () =>
    this.setState(state => ({
      moreVisible: !state.moreVisible,
    }));

  render() {
    const {
      loadingMessage,
      annotations,
      connectedDevices,
      fileTreeShown,
      devicePreviewShown,
      devicePreviewPlatform,
      editorMode,
      sdkVersion,
      onToggleTheme,
      onTogglePanels,
      onToggleFileTree,
      onToggleDevicePreview,
      onToggleVimMode,
      onChangeDevicePreviewPlatform,
      onChangeSDKVersion,
      onPrettifyCode,
      theme,
    } = this.props;

    const isErrorFatal = annotations.some(a => a.severity > 3);
    const isLoading = Boolean(loadingMessage);
    const isLight = theme !== 'light' || isLoading || isErrorFatal;

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
                  ? isErrorFatal ? styles.errorTextFatal : styles.errorText
                  : styles.successText
              )}>
              {annotations.length
                ? `${annotations[0].source}: ${annotations[0].message.split('\n')[0]}` +
                  (annotations.length > 1 ? ` (+${annotations.length - 1} more)` : '')
                : 'No errors'}
            </button>
          )}
        </div>
        <span className={css(styles.labeledButton)} onClick={onPrettifyCode}>
          <span className={css(styles.buttonLabel)}>Prettier</span>
          <button
            className={css(
              styles.button,
              isLight ? styles.buttonDark : styles.buttonLight,
              isLight ? styles.prettifyLight : styles.prettifyNormal
            )}
          />
        </span>
        <button
          onClick={this._handleToggleMore}
          className={css(
            styles.button,
            styles.more,
            isLight ? styles.buttonDark : styles.buttonLight,
            isLight ? styles.moreLight : styles.moreNormal
          )}
        />
        <div
          className={css(
            styles.right,
            this.state.moreVisible ? styles.rightVisible : styles.rightHidden
          )}>
          <div className={css(styles.item)}>
            {connectedDevices.length ? (
              <span className={css(styles.device)}>
                {connectedDevices.length === 1
                  ? connectedDevices[0].name
                  : `${connectedDevices.length} Devices`}
              </span>
            ) : null}
          </div>
          <div className={css(styles.item)}>
            <ToggleSwitch
              light={isLight}
              checked={fileTreeShown}
              onChange={onToggleFileTree}
              label="Files"
            />
          </div>
          <div className={css(styles.item)}>
            <ToggleSwitch
              light={isLight}
              checked={theme !== 'light'}
              onChange={onToggleTheme}
              label="Dark theme"
            />
          </div>
          {onToggleVimMode ? (
            <div className={css(styles.item)}>
              <ToggleSwitch
                light={isLight}
                checked={editorMode === 'vim'}
                onChange={onToggleVimMode}
                label="Vim"
              />
            </div>
          ) : null}
          <div className={css(styles.item)}>
            <ToggleSwitch
              light={isLight}
              checked={devicePreviewShown}
              onChange={onToggleDevicePreview}
              label="Preview"
            />
          </div>
          <div className={css(styles.item)}>
            <ToggleButtons
              light={isLight}
              disabled={!devicePreviewShown}
              options={[{ label: 'Android', value: 'android' }, { label: 'iOS', value: 'ios' }]}
              value={devicePreviewPlatform}
              onValueChange={onChangeDevicePreviewPlatform}
              label="Platform"
            />
          </div>
          <div className={css(styles.item)}>
            <SDKVersionSwitcher
              light={isLight}
              sdkVersion={sdkVersion}
              onChange={onChangeSDKVersion}
            />
          </div>
        </div>
      </FooterShell>
    );
  }
}

export default withThemeName(EditorFooter);

const styles = StyleSheet.create({
  left: {
    display: 'flex',
    alignItems: 'stretch',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },

  right: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'flex-end',

    '@media (max-width: 70em)': {
      flexDirection: 'column',
      position: 'absolute',
      right: 0,
      bottom: '2.0625em',
      paddingBottom: '.25em',
      borderWidth: '1px 0 0 1px',
      borderStyle: 'solid',
      borderColor: colors.border,
      backgroundColor: 'inherit',
      boxShadow: '0 1px 8px rgba(0, 0, 0, 0.07)',
      zIndex: -1,
    },
  },

  rightVisible: {
    '@media (max-width: 70em)': {
      display: 'flex',
    },
  },

  rightHidden: {
    '@media (max-width: 70em)': {
      display: 'none',
    },
  },

  item: {
    display: 'flex',
    alignItems: 'center',

    '@media (max-width: 70em)': {
      display: 'block',
      padding: '.5em .5em .5em .25em',
    },
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

  device: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    margin: '0 8px',
    whiteSpace: 'nowrap',

    ':before': {
      content: '""',
      display: 'inline-block',
      height: 14,
      width: 10,
      borderRadius: 3,
      borderWidth: '2px 2px 4px',
      borderColor: 'currentColor',
      borderStyle: 'solid',
      margin: '0 8px',
      opacity: 0.8,
    },
  },

  button: {
    border: 0,
    outline: 0,
    margin: 0,
    padding: '1em 0.5em',
    appearance: 'none',
    backgroundColor: 'transparent',
    backgroundSize: 16,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    width: 16,
  },

  buttonLight: {
    ':active': {
      opacity: 0.5,
    },
  },

  buttonDark: {
    opacity: 0.5,

    ':active': {
      opacity: 0.3,
    },
  },

  labeledButton: {
    display: 'flex',
    flexDirection: 'vertical',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    margin: '0 .5em',
  },

  buttonLabel: {
    flex: 1,
    margin: '0 .5em',
  },

  prettifyNormal: {
    backgroundImage: `url(${require('../assets/prettify-icon.png')})`,
  },

  prettifyLight: {
    backgroundImage: `url(${require('../assets/prettify-icon-light.png')})`,
  },

  more: {
    display: 'none',

    '@media (max-width: 70em)': {
      display: 'inline-block',
      margin: '0 .5em',
    },
  },

  moreNormal: {
    backgroundImage: `url(${require('../assets/more-icon.png')})`,
  },

  moreLight: {
    backgroundImage: `url(${require('../assets/more-icon-light.png')})`,
  },
});
