/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import ButtonLink from './shared/ButtonLink';
import OpenWithExpoButton from './shared/OpenWithExpoButton';
import ModalDialog from './shared/ModalDialog';

import colors from '../configs/colors';
import constants from '../configs/constants';
import QRCode from './QRCode';
import type { SDKVersion } from '../configs/sdk';

import { isNotMobile } from '../utils/detectPlatform';
import constructExperienceURL from '../utils/constructExperienceURL';


type Props = {|
  visible: boolean,
  sdkVersion: SDKVersion,
  channel: string,
  snackId: ?string,
  onDismiss: () => mixed,
|};

export default function QRCodeModal({ sdkVersion, channel, snackId, visible, onDismiss }: Props) {
  const experienceURL = constructExperienceURL({
    sdkVersion,
    channel,
    snackId,
  });

  return (
    <ModalDialog visible={visible} title="Scan with Expo" onDismiss={onDismiss}>
      <div className={css(styles.container)}>
        <p>Install the Expo app and scan this QR code to get started.</p>
        <div className={css(styles.qrcode)}>
          <QRCode sdkVersion={sdkVersion} channel={channel} snackId={snackId} />
        </div>
        {!isNotMobile() ? (
          <OpenWithExpoButton sdkVersion={sdkVersion} channel={channel} snackId={snackId} />
        ) : null}
        <ButtonLink
          target="_blank"
          href={constants.links.playstore}
          className={css(styles.button, styles.playstore)}>
          Get Android App
        </ButtonLink>
      </div>
    </ModalDialog>
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
  projectLink: {
    margin: '1em',
    height: 208,
    width: '80%',
    backgroundColor: colors.content.light,
    border: `4px solid ${colors.content.light}`,
    borderRadius: 2,
  },
  title: {
    fontSize: '2em',
    fontWeight: 500,
  },
  button: {
    display: 'block',
    width: 208,
    margin: '.5em',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '.5em center',
    '-webkit-font-smoothing': 'initial',
  },
  playstore: {
    backgroundImage: `url(${require('../assets/play-store-icon.png')})`,
    backgroundSize: '20px 23px',
  },
  appstore: {
    backgroundImage: `url(${require('../assets/app-store-icon.png')})`,
    backgroundSize: '12px 23px',
  },
});
