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
import type { SDKVersion } from '../../configs/sdk';

export type PublishModals =
  | 'auth'
  | 'publish-prompt-save'
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
  hasShownEditNameDialog: boolean,
};

class PublishManager extends React.Component<Props, State> {
  state = {
    isPublishing: false,
    hasShownEditNameDialog: false,
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

  _handleSaveToProfile = async () => {
    const isLoggedIn = Boolean(this.props.viewer);

    if (isLoggedIn) {
      // Show a spinner so we dismiss the auth modal
      this.props.onShowModal('publish-working');

      this._handlePublishAsync();
    } else {
      this.props.onShowModal('auth');
    }
  };

  _handleSubmitMetadata = async (details: *) => {
    // Save the new name and description, then publish the snack
    await this.props.onSubmitMetadata(details);
    await this._handlePublishAsync();
  };

  _handlePublishAsync = async () => {
    const isLoggedIn = Boolean(this.props.viewer);

    if (
      // Ask for name if name is empty
      !this.props.name ||
      // Or if the name was a generated name and we haven't asked for a name previously
      (!isIntentionallyNamed(this.props.name) && !this.state.hasShownEditNameDialog)
    ) {
      this.props.onShowModal('publish-edit-name');
      this.setState({ hasShownEditNameDialog: true });
    } else {
      if (isLoggedIn) {
        // If user is logged in, save the snack to profile
        await this._publishWithOptionsAsync({
          allowedOnProfile: true,
        });

        this.props.onShowModal('publish-success');
      } else {
        // If user is a guest, publish and prompt to save to profile
        await this._publishWithOptionsAsync({
          allowedOnProfile: false,
        });

        this.props.onShowModal('publish-prompt-save');
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
          action={this.state.isPublishing ? 'Publishing…' : 'Publish'}
          isWorking={this.state.isPublishing}
          onDismiss={onHideModal}
          name={name}
          description={description}
          onSubmit={this._handleSubmitMetadata}
        />
        <ModalAuthentication
          visible={currentModal === 'auth'}
          onDismiss={onHideModal}
          onComplete={this._handleSaveToProfile}
        />
        <ModalPublishToProfile
          visible={currentModal === 'publish-prompt-save'}
          onDismiss={onHideModal}
          snackUrl={snackId ? `https://snack.expo.io/${snackId}` : undefined}
          onPublish={this._handleSaveToProfile}
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
