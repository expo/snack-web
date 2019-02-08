import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import ToggleSwitch from './shared/ToggleSwitch';
import ToggleButtons from './shared/ToggleButtons';
import LoadingText from './shared/LoadingText';
import EmbeddedFooterShell from './Shell/EmbeddedFooterShell';

type Props = {
  isResolving: boolean;
  loadingMessage: string | undefined;
  devicePreviewShown: boolean;
  devicePreviewPlatform: 'android' | 'ios';
  onToggleDevicePreview: () => void;
  onChangeDevicePreviewPlatform: (platform: 'android' | 'ios') => void;
};

export default class EmbeddedEditorFooter extends React.PureComponent<Props> {
  render() {
    const {
      isResolving,
      loadingMessage,
      devicePreviewShown,
      devicePreviewPlatform,
      onToggleDevicePreview,
      onChangeDevicePreviewPlatform,
    } = this.props;

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
            options={[{ label: 'Android', value: 'android' }, { label: 'iOS', value: 'ios' }]}
            value={devicePreviewPlatform}
            onValueChange={onChangeDevicePreviewPlatform}
            label="Platform"
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
