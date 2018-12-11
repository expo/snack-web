import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import ToggleSwitch from './shared/ToggleSwitch';
import ToggleButtons from './shared/ToggleButtons';
import LoadingText from './shared/LoadingText';
import EmbeddedFooterShell from './Shell/EmbeddedFooterShell';
import withThemeName, { ThemeName } from './Preferences/withThemeName';

type Props = {
  isResolving: boolean;
  loadingMessage: string | undefined;
  devicePreviewShown: boolean;
  devicePreviewPlatform: 'android' | 'ios';
  onToggleDevicePreview: () => void;
  onChangeDevicePreviewPlatform: (platform: 'android' | 'ios') => void;
  theme: ThemeName;
};

class EmbeddedEditorFooter extends React.PureComponent<Props> {
  render() {
    const {
      isResolving,
      loadingMessage,
      devicePreviewShown,
      devicePreviewPlatform,
      onToggleDevicePreview,
      onChangeDevicePreviewPlatform,
      theme,
    } = this.props;

    return (
      <EmbeddedFooterShell type={isResolving ? 'loading' : undefined}>
        <div>{isResolving ? <LoadingText>{loadingMessage}</LoadingText> : null}</div>
        <div className={css(styles.right)}>
          <ToggleSwitch
            light={theme !== 'light'}
            checked={devicePreviewShown}
            onChange={onToggleDevicePreview}
            label="Preview"
          />
          <ToggleButtons
            light={theme !== 'light'}
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

export default withThemeName(EmbeddedEditorFooter);

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
