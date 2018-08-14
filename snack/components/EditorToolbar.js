/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';


import Button from './shared/Button';
import EditorTitle from './EditorTitle';
import EditorImportTitle from './EditorImportTitle';
import SearchButton from './Search/SearchButton';
import colors from '../configs/colors';
import withThemeName, { type ThemeName } from './theming/withThemeName';

type Props = {|
  name: string,
  description: string,
  hasSnackId: boolean,
  isSaving: boolean,
  isDownloading: boolean,
  isSaved: boolean,
  isResolving: boolean,
  isEditModalVisible: boolean,
  onShowEditModal: () => mixed,
  onSaveEditModal: (details: { name: string, description: string }) => mixed,
  onDismissEditModal: () => mixed,
  onShowEmbedCode: () => void,
  onDownloadCode: () => Promise<void>,
  onShowQRCode: () => void,
  onSaveAsync: () => Promise<void>,
  theme: ThemeName,
  creatorUsername?: string,
|};

class EditorToolbar extends React.PureComponent<Props, void> {
  render() {
    const {
      name,
      description,
      hasSnackId,
      isSaving,
      isDownloading,
      isSaved,
      isResolving,
      isEditModalVisible,
      onShowEditModal,
      onSaveEditModal,
      onDismissEditModal,
      onShowEmbedCode,
      onDownloadCode,
      onShowQRCode,
      onSaveAsync,
      creatorUsername,
      theme,
    } = this.props;

    return (
      <div
        className={css(
          styles.toolbar,
          theme === 'light' ? styles.toolbarLight : styles.toolbarDark
        )}>
        <div className={css(styles.left)}>
          <img
            src={
              theme === 'dark'
                ? require('../assets/snack-icon-dark.svg')
                : require('../assets/snack-icon.svg')
            }
            alt="Snack"
            className={css(styles.logo)}
          />
          {creatorUsername !== 'git' || !name || !description ? (
            <EditorTitle
              name={name}
              description={description}
              isEditModalVisible={isEditModalVisible}
              onShowEditModal={onShowEditModal}
              onSaveEditModal={onSaveEditModal}
              onDismissEditModal={onDismissEditModal}
            />
          ) : (
            <EditorImportTitle name={name} description={description} />
          )}
        </div>
        <div className={css(styles.buttons)}>
          <SearchButton />
          <Button disabled={!hasSnackId} onClick={onShowEmbedCode}>
            Embed code
          </Button>
          <Button onClick={onShowQRCode}>Run on device</Button>
          <Button onClick={onDownloadCode} disabled={!hasSnackId || isDownloading || isSaving}>
            Export to XDE
          </Button>
          <Button
            variant="accent"
            onClick={onSaveAsync}
            disabled={isSaving || isResolving || isSaved}
            loading={isSaving}
            className={css(styles.saveButton)}>
            {isSaving ? 'Saving…' : isSaved ? 'Changes saved' : 'Save changes'}
          </Button>
        </div>
      </div>
    );
  }
}

export default withThemeName(EditorToolbar);

const styles = StyleSheet.create({
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${colors.border}`,
    padding: 4,
  },

  toolbarLight: {
    backgroundColor: colors.content.light,
  },

  toolbarDark: {
    backgroundColor: colors.content.dark,
  },

  left: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    flex: 1,
  },

  logo: {
    width: 36,
    height: 'auto',
    margin: '0 .5em 0 .75em',
  },

  buttons: {
    display: 'flex',
    flexDirection: 'row',
  },

  saveButton: {
    minWidth: '9.2em',
  },
});
