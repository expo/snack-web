/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import Button from '../shared/Button';
import ModalDialog from '../shared/ModalDialog';

type Props = {|
  username: ?string,
  slug: string,
  visible: boolean,
  onEditName: () => mixed,
  onDismiss: () => mixed,
|};

export default class ModalPublishOverwriteError extends React.Component<Props> {
  render() {
    return (
      <ModalDialog
        visible={this.props.visible}
        onDismiss={this.props.onDismiss}
        title="Experience already exists!">
        <p className={css(styles.text)}>
          You already have an experience published under "{this.props.username
            ? `@${this.props.username}/${this.props.slug}`
            : this.props.slug}" in your profile. Please choose another name for the Snack and save
          again.
        </p>
        <Button large variant="secondary" onClick={this.props.onEditName}>
          Choose another name
        </Button>
      </ModalDialog>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});
