/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import Button from './shared/Button';
import ToolbarShell from './Shell/ToolbarShell';
import ToolbarTitleShell from './Shell/ToolbarTitleShell';
import EditorTitle from './EditorTitle';
import EditorImportTitle from './EditorImportTitle';
import SearchButton from './Search/SearchButton';

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
  creatorUsername?: string,
|};

export default class EditorToolbar extends React.PureComponent<Props, void> {
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
    } = this.props;

    return (
      <ToolbarShell>
        <ToolbarTitleShell>
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
        </ToolbarTitleShell>
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
      </ToolbarShell>
    );
  }
}

const styles = StyleSheet.create({
  buttons: {
    display: 'flex',
    flexDirection: 'row',
  },

  saveButton: {
    minWidth: 128,
  },
});
