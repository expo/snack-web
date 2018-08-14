/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import { connect } from 'react-redux';

import ModalDialog from '../shared/ModalDialog';
import Avatar from '../shared/Avatar';
import colors from '../../configs/colors';
import Segment from '../../utils/Segment';
import { type Viewer } from '../../types';

type Props = {|
  authFlow?: 'save1' | 'save2',
  visible: boolean,
  viewer: ?Viewer,
  snackUrl?: string,
  snackProfileUrl?: string,
  onDismiss: () => mixed,
|};

class ModalSuccessfulPublish extends React.PureComponent<Props> {
  componentDidUpdate(prevProps: Props) {
    if (!prevProps.visible && this.props.visible) {
      Segment.getInstance().logEvent('CREATED_USER_SNACK');
    }
  }

  _openProfileAndDismissModal = () => {
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }

    Segment.getInstance().logEvent('VIEWED_OWNED_USER_SNACKS');

    if (this.props.viewer) {
      window.open(`https://expo.io/snacks/@${this.props.viewer.username}/`);
    }
  };

  render() {
    const picture = this.props.viewer ? this.props.viewer.picture : null;

    return (
      <ModalDialog visible={this.props.visible} onDismiss={this.props.onDismiss}>
        {picture ? (
          <div className={css(styles.avatar)}>
            <Avatar src={picture} size="80px" />
          </div>
        ) : null}
        <h2 className={css(styles.heading)}>Your Snack was Saved</h2>
        <p className={css(styles.text)}>
          You can now find your Snack on your profile and link others to it. Share it with your
          friends!
        </p>
        <p className={css(styles.caption)}>
          <span
            className={css(styles.link)}
            onClick={this._openProfileAndDismissModal}
            target="blank">
            View your Snacks
          </span>
        </p>
      </ModalDialog>
    );
  }
}

// TODO(jim): We need to plug the user in.
export default connect(state => ({
  authFlow: state.splitTestSettings.authFlow || 'save1',
}))(ModalSuccessfulPublish);

const styles = StyleSheet.create({
  avatar: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 500,
    lineHeight: '24px',
    textAlign: 'center',
  },
  text: {
    marginBottom: 24,
    fontSize: '16px',
    padding: '0 24px 0 24px',
    lineHeight: '22px',
    textAlign: 'center',
  },
  caption: {
    fontSize: '16px',
    lineHeight: '22px',
    textAlign: 'center',
  },
  link: {
    cursor: 'pointer',
    color: colors.primary,
    textDecoration: 'underline',
  },
});
