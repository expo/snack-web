import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import Button from './shared/Button';
import ToolbarShell from './Shell/ToolbarShell';
import ToolbarTitleShell from './Shell/ToolbarTitleShell';
import IconButton from './shared/IconButton';
import EditorTitle from './EditorTitle';
import EditorImportTitle from './EditorImportTitle';
import SearchButton from './Search/SearchButton';
import UserMenu from './UserMenu';
import ModalAuthentication from './Auth/ModalAuthentication';
import { SaveStatus, SaveHistory, Viewer } from '../types';
import usePreferences from './Preferences/usePreferences';

type Props = {
  name: string;
  description: string;
  createdAt: string | undefined;
  saveStatus: SaveStatus;
  saveHistory: SaveHistory;
  viewer: Viewer | undefined;
  isDownloading: boolean;
  isResolving: boolean;
  isAuthModalVisible: boolean;
  isEditModalVisible: boolean;
  onSubmitMetadata: (
    details: {
      name: string;
      description: string;
    },
    draft?: boolean
  ) => Promise<void>;
  onShowPreviousSaves: () => void;
  onShowEditModal: () => void;
  onDismissEditModal: () => void;
  onShowAuthModal: () => void;
  onDismissAuthModal: () => void;
  onShowEmbedCode: () => void;
  onDownloadCode: () => Promise<void>;
  onShowQRCode: () => void;
  onPublishAsync: () => Promise<void>;
  creatorUsername?: string;
};

export default function EditorToolbar(props: Props) {
  const [isLoggingIn, setIsLoggingIn] = React.useState<boolean>(false);
  const [preferences] = usePreferences();

  const {
    name,
    description,
    createdAt,
    saveHistory,
    saveStatus,
    viewer,
    isDownloading,
    isResolving,
    isEditModalVisible,
    isAuthModalVisible,
    onSubmitMetadata,
    onShowPreviousSaves,
    onShowEditModal,
    onDismissEditModal,
    onShowAuthModal,
    onDismissAuthModal,
    onShowEmbedCode,
    onDownloadCode,
    onShowQRCode,
    onPublishAsync,
    creatorUsername,
  } = props;
  const { theme } = preferences;

  const handleShowAuthModal = () => {
    setIsLoggingIn(true);
    onShowAuthModal();
  };

  const handleDismissAuthModal = () => {
    setIsLoggingIn(false);
    onDismissAuthModal();
  };

  const isPublishing = saveStatus === 'publishing';
  const isPublished = saveStatus === 'published';

  return (
    <ToolbarShell>
      <ToolbarTitleShell>
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
            createdAt={createdAt}
            saveHistory={saveHistory}
            saveStatus={saveStatus}
            viewer={viewer}
            onLogInClick={handleShowAuthModal}
            isEditModalVisible={isEditModalVisible}
            onSubmitMetadata={onSubmitMetadata}
            onShowPreviousSaves={onShowPreviousSaves}
            onShowEditModal={onShowEditModal}
            onDismissEditModal={onDismissEditModal}
          />
        ) : (
          <EditorImportTitle name={name} description={description} />
        )}
        <Button
          variant="accent"
          onClick={onPublishAsync}
          disabled={isPublishing || isResolving || isPublished}
          loading={isPublishing}
          className={css(styles.saveButton)}>
          {isPublishing ? 'Saving…' : isPublished ? 'Saved' : 'Save'}
        </Button>
      </ToolbarTitleShell>
      <div className={css(styles.buttons)}>
        <SearchButton responsive />
        <IconButton responsive title="Run on device" onClick={onShowQRCode}>
          <svg width="21" height="21" viewBox="0 0 20 20">
            <path d="M8.333 7.083v5.667l4.534-2.833-4.534-2.834z" />
            <path d="M8.333 10H2.5" stroke-width="1.5" stroke-linecap="round" />
            <path
              d="M5.444 11.889v3.778c0 1.043.846 1.889 1.89 1.889h6.61a1.889 1.889 0 001.89-1.89V4.334a1.889 1.889 0 00-1.89-1.889h-6.61a1.889 1.889 0 00-1.89 1.89V8.11"
              stroke-width="2"
              fill="none"
            />
            <rect x="8.333" y="2" width="5" height="2.5" rx=".833" />
          </svg>
        </IconButton>
        <IconButton
          responsive
          title="Export to expo-cli"
          onClick={onDownloadCode}
          disabled={isDownloading || isPublishing}>
          <svg width="20" height="20">
            <path d="M14.167 10H5.833L10 16.667 14.167 10z" />
            <path d="M2.5 18.333h15M10 10V1.667" stroke-width="2" stroke-linecap="round" />
          </svg>
        </IconButton>
        <IconButton responsive title="Show embed code" onClick={onShowEmbedCode}>
          <svg width="20" height="20" fill="none">
            <path
              d="M13.333 15l5-5-5-5M6.667 5l-5 5 5 5"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </IconButton>
        <UserMenu onLogInClick={handleShowAuthModal} />
        <ModalAuthentication
          visible={isLoggingIn && isAuthModalVisible}
          onDismiss={handleDismissAuthModal}
          onComplete={handleDismissAuthModal}
        />
      </div>
    </ToolbarShell>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 36,
    height: 'auto',
    margin: '0 .5em 0 .75em',
  },

  buttons: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 5,
  },

  saveButton: {
    minWidth: 100,
  },
});
