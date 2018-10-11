/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import WhyNoQrBanner from './WhyNoQrBanner';
import SignedInInstructions from './SignedInInstructions';
import SendProjectLink from './SendProjectLink';
import AuthenticationForm from '../Auth/AuthenticationForm';
import withAuth, { type AuthProps } from '../../auth/withAuth';
import constructExperienceURL from '../../utils/constructExperienceURL';
import type { SDKVersion } from '../../configs/sdk';

export type ConnectionMethod = 'device-id' | 'sign-in' | 'qr-code';

type Props = AuthProps & {|
  isEmbedded: boolean,
  sdkVersion: SDKVersion,
  channel: string,
  snackId: ?string,
  onSuccess?: () => Promise<void>,
|};

class AccountTab extends React.Component<Props> {
  render() {
    const { sdkVersion, channel, snackId, viewer, logout, isEmbedded, onSuccess } = this.props;

    if (viewer) {
      return <SignedInInstructions viewer={viewer} logout={logout} />;
    }

    if (isEmbedded) {
      const url = constructExperienceURL({
        sdkVersion,
        channel,
        snackId,
      });

      return (
        <React.Fragment>
          <SendProjectLink url={url} />
          <WhyNoQrBanner className={css(styles.whyNoQRCode)} />
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <WhyNoQrBanner />
        <AuthenticationForm onSuccess={onSuccess} />
      </React.Fragment>
    );
  }
}

export default withAuth(AccountTab);

const styles = StyleSheet.create({
  button: {
    display: 'block',
    width: 208,
    margin: '.5em',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '.5em center',
  },
  appstore: {
    backgroundImage: `url(${require('../../assets/app-store-icon.png')})`,
    backgroundSize: '12px 23px',
  },
  whyNoQRCode: {
    marginTop: '15px',
    marginBottom: '5px',
  },
});
