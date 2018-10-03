/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import WhyNoQrBanner from './WhyNoQrBanner';

import colors from '../../configs/colors';
import QRCode from '../QRCode';
import type { SDKVersion } from '../../configs/sdk';

type Props = {|
  sdkVersion: SDKVersion,
  channel: string,
  snackId: ?string,
|};

export default function AndroidInstructions({ sdkVersion, channel, snackId }: Props) {
  return (
    <div className={css(styles.container)}>
      <WhyNoQrBanner />
      <p>Download the Expo app on your Android device and scan this QR code to get started.</p>
      <div className={css(styles.qrcode)}>
        <QRCode sdkVersion={sdkVersion} channel={channel} snackId={snackId} />
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  qrcode: {
    margin: '1em',
    height: 208,
    width: 208,
    backgroundColor: colors.content.light,
    border: `4px solid ${colors.content.light}`,
    borderRadius: 2,
  },
  button: {
    display: 'block',
    width: 208,
    margin: '.5em',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '.5em center',
    '-webkit-font-smoothing': 'initial',
  },
});
