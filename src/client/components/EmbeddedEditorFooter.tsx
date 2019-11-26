import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import ToggleSwitch from './shared/ToggleSwitch';
import ToggleButtons from './shared/ToggleButtons';
import LoadingText from './shared/LoadingText';
import EmbeddedFooterShell from './Shell/EmbeddedFooterShell';
import { Platform } from '../types';
import { SDKVersion } from '../configs/sdk';
import * as PlatformOptions from '../utils/PlatformOptions';

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

export default class EmbeddedEditorFooter extends React.PureComponent<Props> {
  render() {
    const {
      devicePreviewPlatform,
      devicePreviewShown,
      isResolving,
      loadingMessage,
      onChangeDevicePreviewPlatform,
      onToggleDevicePreview,
      sdkVersion,
      supportedPlatformsQueryParam,
    } = this.props;

    let options = PlatformOptions.filter({ sdkVersion, supportedPlatformsQueryParam });
    let platform = PlatformOptions.getSelectedPlatform({
      sdkVersion,
      devicePreviewPlatform,
      options,
    });

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
            options={options}
            value={platform}
            onValueChange={onChangeDevicePreviewPlatform}
          />
        </div>
      </EmbeddedFooterShell>
    );
  }
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
