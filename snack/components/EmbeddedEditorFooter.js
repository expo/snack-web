/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';

import ToggleSwitch from './shared/ToggleSwitch';
import ToggleButtons from './shared/ToggleButtons';
import LoadingText from './shared/LoadingText';
import colors from '../configs/colors';
import withThemeName, { type ThemeName } from './theming/withThemeName';

type Props = {|
  isResolving: boolean,
  loadingMessage: ?string,
  devicePreviewShown: boolean,
  devicePreviewPlatform: 'android' | 'ios',
  onToggleDevicePreview: Function,
  onChangeDevicePreviewPlatform: Function,
  theme: ThemeName,
  className?: string,
|};

class EmbeddedEditorFooter extends React.PureComponent<Props, void> {
  render() {
    const {
      isResolving,
      loadingMessage,
      devicePreviewShown,
      devicePreviewPlatform,
      onToggleDevicePreview,
      onChangeDevicePreviewPlatform,
      theme,
      className,
    } = this.props;

    return (
      <div
        className={classnames(
          css(styles.footer),
          className,
          isResolving ? styles.footerLoading : undefined
        )}>
        <div className={css(styles.left)}>
          {isResolving ? (
            <LoadingText className={css(styles.statusText)}>{loadingMessage}</LoadingText>
          ) : null}
        </div>
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
      </div>
    );
  }
}

export default withThemeName(EmbeddedEditorFooter);

const styles = StyleSheet.create({
  footer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderTop: `1px solid ${colors.border}`,
    color: '#999',
    fontSize: '.85em',
    transition: 'background .2s',
    padding: '.25em 0',
  },

  footerLoading: {
    backgroundColor: colors.primary,
    color: '#fff',
  },

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
