import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import ToggleSwitch from './shared/ToggleSwitch';
import ToggleButtons from './shared/ToggleButtons';
import LoadingText from './shared/LoadingText';
import EmbeddedFooterShell from './Shell/EmbeddedFooterShell';
import { Platform } from '../types';
import { SDKVersion } from '../configs/sdk';
import FeatureFlags from '../utils/FeatureFlags';

type Props = {
  isResolving: boolean;
  loadingMessage: string | undefined;
  devicePreviewShown: boolean;
  devicePreviewPlatform: Platform;
  sdkVersion: SDKVersion;
  supportedPlatformsQueryParam: string | undefined;
  onToggleDevicePreview: () => void;
  onChangeDevicePreviewPlatform: (platform: Platform) => void;
};

type PlatformOption = {
  label: string;
  value: Platform;
};

export default class EmbeddedEditorFooter extends React.PureComponent<Props> {
  render() {
    const {
      isResolving,
      loadingMessage,
      devicePreviewShown,
      onToggleDevicePreview,
      onChangeDevicePreviewPlatform,
    } = this.props;

    let options = this._getPlatformOptions();
    let platform = this._getSelectedPlatform(options);

    return (
      <EmbeddedFooterShell type={isResolving ? 'loading' : undefined}>
        <div>{isResolving ? <LoadingText>{loadingMessage}</LoadingText> : null}</div>
        <div className={css(styles.right)}>
          <ToggleSwitch
            checked={devicePreviewShown}
            onChange={onToggleDevicePreview}
            label="Preview"
          />
          <ToggleButtons
            disabled={!devicePreviewShown}
            options={this._getPlatformOptions()}
            value={platform}
            onValueChange={onChangeDevicePreviewPlatform}
          />
        </div>
      </EmbeddedFooterShell>
    );
  }

  _getSelectedPlatform = (options: PlatformOption[]) => {
    const { devicePreviewPlatform, sdkVersion } = this.props;

    let selectedPlatform: Platform = devicePreviewPlatform;

    // If we don't support web yet, default to Android
    if (selectedPlatform === 'web' && !FeatureFlags.isAvailable('PLATFORM_WEB', sdkVersion)) {
      selectedPlatform = 'android';
    }

    // If the selected platform is not enabled for this Snack then fallback to
    // the first available platform
    if (!options.find(platformOption => platformOption.value === selectedPlatform)) {
      selectedPlatform = options[0].value;
    }

    return selectedPlatform;
  };

  _getPlatformOptions = () => {
    let defaultPlatformOptions: PlatformOption[] = [];
    if (FeatureFlags.isAvailable('PLATFORM_WEB', this.props.sdkVersion)) {
      defaultPlatformOptions = [
        { label: 'iOS', value: 'ios' },
        { label: 'Android', value: 'android' },
        { label: 'Web', value: 'web' },
      ];
    } else {
      defaultPlatformOptions = [
        { label: 'iOS', value: 'ios' },
        { label: 'Android', value: 'android' },
      ];
    }

    if (this.props.supportedPlatformsQueryParam) {
      let parsedSupportedPlatformsQueryParam = this.props.supportedPlatformsQueryParam.split(',');
      let supportedPlatforms = defaultPlatformOptions.filter(platform =>
        parsedSupportedPlatformsQueryParam.includes(platform.value)
      );

      // If none of the provided platforms are valid, fallback to supporting all platforms.
      if (supportedPlatforms.length) {
        return supportedPlatforms;
      }
    }

    return defaultPlatformOptions;
  };
}

const styles = StyleSheet.create({
  loadingText: {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '.5em',
  },

  right: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
  },
});
