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
  sdkVersion: SDKVersion
  onToggleDevicePreview: () => void;
  onChangeDevicePreviewPlatform: (platform: Platform) => void;
};

export default class EmbeddedEditorFooter extends React.PureComponent<Props> {
  render() {
    const {
      isResolving,
      loadingMessage,
      devicePreviewShown,
      devicePreviewPlatform,
      sdkVersion,
      onToggleDevicePreview,
      onChangeDevicePreviewPlatform,
    } = this.props;

    const platform =
      devicePreviewPlatform === 'web' && !FeatureFlags.isAvailable('PLATFORM_WEB', sdkVersion)
        ? 'android'
        : devicePreviewPlatform;
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
            options={
              FeatureFlags.isAvailable('PLATFORM_WEB', this.props.sdkVersion)
                ? [
                    { label: 'iOS', value: 'ios' },
                    { label: 'Android', value: 'android' },
                    { label: 'Web', value: 'web' },
                  ]
               :
                 [{ label: 'iOS', value: 'ios' }, { label: 'Android', value: 'android' }]
            }
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
