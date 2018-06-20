/* @flow */

import * as React from 'react';
import ModalAuthentication from '../Auth/ModalAuthentication';
import ModalEditTitleAndDescription from '../ModalEditTitleAndDescription';
import ModalPublishToProfile from './ModalPublishToProfile';
import ModalSuccessfulPublish from './ModalSuccessfulPublish';
import ModalPublishUnknownError from './ModalPublishUnknownError';
import ModalPublishOverwriteError from './ModalPublishOverwriteError';
import ModalPublishing from './ModalPublishing';
import withAuth, { type AuthProps } from '../../auth/withAuth';
import { isIntentionallyNamed } from '../../utils/projectNames';
import * as Strings from '../../utils/strings';
import type { SDKVersion } from '../../configs/sdk';

export type PublishModals =
  | 'auth'
  | 'publish'
  | 'publish-edit-name'
  | 'publish-success'
  | 'publish-working'
  | 'publish-unknown-error'
  | 'publish-overwrite-experience-error'
  | null;

type PublishOptions = {
  allowedOnProfile?: boolean,
};

type Props = AuthProps & {
  name: string,
  description: string,
  onSubmitMetadata: (details: { name: string, description: string }) => Promise<void>,
  onPublishAsync: (options: PublishOptions) => Promise<void>,
  currentModal: ?string,
  onShowModal: (name: PublishModals) => mixed,
  onHideModal: () => mixed,
  creatorUsername: ?string,
  snackId: ?string,
  sdkVersion: SDKVersion,
  nameHasChanged: boolean,
  children: ({
    onPublishAsync: () => Promise<void>,
    isPublishing: boolean,
  }) => React.Node,
};

type State = {
  isPublishing: boolean,
  didDismissAuthFlow: boolean,
  isAllowedOnProfile: boolean,
};

class PublishManager extends React.Component<Props, State> {
  state = {
    isPublishing: false,
    didDismissAuthFlow: false,
    isAllowedOnProfile:
      !!this.props.viewer && this.props.creatorUsername === this.props.viewer.username,
  };

  _publishWithOptionsAsync = async (options: PublishOptions) => {
    this.setState({ isPublishing: true });

    try {
      await this.props.onPublishAsync(options);
    } catch (e) {
      if (/Experience .+ already exists/.test(e.message)) {
        this.props.onShowModal('publish-overwrite-experience-error');
      } else {
        this.props.onShowModal('publish-unknown-error');
      }

      throw e;
    } finally {
      this.setState({ isPublishing: false });
    }
  };

  _publishAndShowSuccess = async () => {
    if (this.props.viewer) {
      await this._publishWithOptionsAsync({
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
    this.props.onShowModal('publish-working');
    this._publishAndShowSuccess();
  };

  _handlePublishAsync = async () => {
    // TODO: remove this, this is a patch for bad prod behaviour where users cannot save their own snack
    const savingOwnSnack =
      this.props.viewer && this.props.viewer.username === this.props.creatorUsername;

    await this._publishWithOptionsAsync({
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
        {children({
          onPublishAsync: this._handlePublishAsync,
          isPublishing: this.state.isPublishing,
        })}
        <ModalEditTitleAndDescription
          visible={currentModal === 'publish-edit-name'}
          title="Publish your Snack"
          onDismiss={this._handleHideAuthFlowModal}
          name={name}
          description={description}
          onSubmit={this._handleSubmitMetadata}
          onSkip={this._handleSkipEdit}
          isPublishing={this.state.isPublishing}
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
          isPublishing={this.state.isPublishing}
        />
        <ModalSuccessfulPublish
          visible={currentModal === 'publish-success'}
          viewer={viewer}
          onDismiss={onHideModal}
        />
        <ModalPublishUnknownError
          visible={currentModal === 'publish-unknown-error'}
          onDismiss={onHideModal}
        />
        <ModalPublishing visible={currentModal === 'publish-working'} onDismiss={onHideModal} />
        <ModalPublishOverwriteError
          visible={currentModal === 'publish-overwrite-experience-error'}
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
