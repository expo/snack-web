/* @flow */

import * as React from 'react';

import ModalDialog from '../shared/ModalDialog';
import AuthenticationForm from './AuthenticationForm';
import withAuth, { type AuthProps } from '../../auth/withAuth';

type Props = AuthProps & {|
  visible: boolean,
  onDismiss: () => mixed,
  onComplete: () => mixed,
  onSuccess?: () => Promise<void>,
  onError?: () => mixed,
|};

type State = {
  error: boolean,
};

class ModalAuthentication extends React.Component<Props, State> {
  componentDidUpdate(prevProps: Props) {
    if (this.props.visible && this.props.viewer !== prevProps.viewer) {
      this.props.onComplete();
    }
  }

  render() {
    return (
      <ModalDialog
        visible={this.props.visible}
        onDismiss={this.props.onDismiss}
        title="Log in to Expo">
        <AuthenticationForm onSuccess={this.props.onSuccess} onError={this.props.onError} />
      </ModalDialog>
    );
  }
}

export default withAuth(ModalAuthentication);
