/* @flow */

import * as React from 'react';
import ModalAuthentication from '../Auth/ModalAuthentication';
import ModalEditTitleAndDescription from '../ModalEditTitleAndDescription';
import ModalPublishToProfile from './ModalPublishToProfile';
import ModalSuccessfulPublish from './ModalSuccessfulPublish';
import ModalSaveUnknownError from './ModalSaveUnknownError';
import ModalSaveOverwriteError from './ModalSaveOverwriteError';
import ModalSaving from './ModalSaving';
import withAuth, { type AuthProps } from '../../auth/withAuth';
import { isIntentionallyNamed } from '../../utils/projectNames';
import * as Strings from '../../utils/strings';
import type { SDKVersion } from '../../configs/sdk';

export type PublishModals =
  | 'auth'
  | 'publish'
  | 'publish-edit-name'
  | 'publish-success'
  | 'publish-saving'
  | 'save-unknown-error'
  | 'save-overwrite-experience-error'
  | null;

type SaveOptions = {
  allowedOnProfile?: boolean,
};

type Props = AuthProps & {
  name: string,
  description: string,
  onSubmitMetadata: (details: { name: string, description: string }) => Promise<void>,
  onSaveAsync: (options: SaveOptions) => Promise<void>,
  currentModal: ?string,
  onShowModal: (name: PublishModals) => mixed,
  onHideModal: () => mixed,
  creatorUsername: ?string,
  snackId: ?string,
  sdkVersion: SDKVersion,
  nameHasChanged: boolean,
  children: ({
    onSaveAsync: () => Promise<void>,
    isSaving: boolean,
  }) => React.Node,
};

type State = {
  isSaving: boolean,
  didDismissAuthFlow: boolean,
  isAllowedOnProfile: boolean,
};

class PublishManager extends React.Component<Props, State> {
  state = {
    isSaving: false,
    didDismissAuthFlow: false,
    isAllowedOnProfile:
      !!this.props.viewer && this.props.creatorUsername === this.props.viewer.username,
  };

  _saveWithOptionsAsync = async (options: SaveOptions) => {
    this.setState({ isSaving: true });

    try {
      await this.props.onSaveAsync(options);
    } catch (e) {
      if (/Experience .+ already exists/.test(e.message)) {
        this.props.onShowModal('save-overwrite-experience-error');
      } else {
        this.props.onShowModal('save-unknown-error');
      }

      throw e;
    } finally {
      this.setState({ isSaving: false });
    }
  };

  _publishAndShowSuccess = async () => {
    if (this.props.viewer) {
      await this._saveWithOptionsAsync({
        allowedOnProfile: this.state.isAllowedOnProfile,
      });

      this.props.onShowModal('publish-success');
    } else {
      this.props.onShowModal('auth');
    }
  };

  _handlePublishToProfile = async () => {
    this.setState({ isAllowedOnProfile: true }, () => {
      if (!isIntentionallyNamed(this.props.name)) {
        this.props.onShowModal('publish-edit-name');
      } else {
        this._publishAndShowSuccess();
      }
    });
  };

  _handleHideAuthFlowModal = () => {
    this.props.onHideModal();
    this.setState({ didDismissAuthFlow: true });
  };

  _handleSubmitMetadata = async (details: { name: string, description: string }) => {
    await this.props.onSubmitMetadata(details);
    this._publishAndShowSuccess();
  };

  _handleSkipEdit = () => {
    this.props.onShowModal('publish-saving');
    this._publishAndShowSuccess();
  };

  _handleSaveAsync = async () => {
    // TODO: remove this, this is a patch for bad prod behaviour where users cannot save their own snack
    const savingOwnSnack =
      this.props.viewer && this.props.viewer.username === this.props.creatorUsername;

    await this._saveWithOptionsAsync({
      allowedOnProfile:
        savingOwnSnack || (this.state.isAllowedOnProfile && !this.props.nameHasChanged),
    });

    if (this.state.didDismissAuthFlow) {
      this.props.onHideModal();
    } else {
      if (
        !this.props.viewer || // user is logged out and saves snack changes
        (this.props.viewer && this.props.nameHasChanged) || // user is logged in and changes the name of a project
        (this.props.viewer && this.props.viewer.username !== this.props.creatorUsername) // when a user is logged in and saving someone elses snack.
      ) {
        this.props.onShowModal('publish');
      } else {
        this.props.onHideModal();
      }
    }
  };

  render() {
    const { snackId, viewer, name, description, currentModal, onHideModal, children } = this.props;

    return (
      <React.Fragment>
        {children({ onSaveAsync: this._handleSaveAsync, isSaving: this.state.isSaving })}
        <ModalEditTitleAndDescription
          visible={currentModal === 'publish-edit-name'}
          title="Save your Snack"
          onDismiss={this._handleHideAuthFlowModal}
          name={name}
          description={description}
          onSubmit={this._handleSubmitMetadata}
          onSkip={this._handleSkipEdit}
          isSaving={this.state.isSaving}
        />
        <ModalAuthentication
          visible={currentModal === 'auth'}
          onDismiss={this._handleHideAuthFlowModal}
          onComplete={this._publishAndShowSuccess}
        />
        <ModalPublishToProfile
          visible={currentModal === 'publish'}
          onDismiss={this._handleHideAuthFlowModal}
          snackUrl={snackId ? `https://snack.expo.io/${snackId}` : undefined}
          onPublish={this._handlePublishToProfile}
          isSaving={this.state.isSaving}
        />
        <ModalSuccessfulPublish
          visible={currentModal === 'publish-success'}
          viewer={viewer}
          onDismiss={onHideModal}
        />
        <ModalSaveUnknownError
          visible={currentModal === 'save-unknown-error'}
          onDismiss={onHideModal}
        />
        <ModalSaving visible={currentModal === 'publish-saving'} onDismiss={onHideModal} />
        <ModalSaveOverwriteError
          visible={currentModal === 'save-overwrite-experience-error'}
          onDismiss={onHideModal}
          username={viewer && viewer.username}
          slug={name}
          onEditName={() => this.props.onShowModal('publish-edit-name')}
        />
      </React.Fragment>
    );
  }
}

export default withAuth(PublishManager);
