/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import QRCode from './QRCode';
import colors from '../configs/colors';
import OpenWithExpoButton from './shared/OpenWithExpoButton';
import Button from './shared/Button';
import constants from '../configs/constants';
import { isIOS, isAndroid } from '../utils/detectPlatform';

import type { SDKVersion } from '../configs/sdk';

type Props = {|
  name: string,
  description: ?string,
  snackId?: string,
  channel: string,
  sdkVersion: SDKVersion,
  onOpenEditor: Function,
  userAgent: string,
|};

const AppDetails = ({
  name,
  description,
  snackId,
  channel,
  sdkVersion,
  onOpenEditor,
  userAgent,
}: Props) => {
  return (
    <div className={css(styles.container)}>
      <div className={css(styles.card)}>
        <div className={css(styles.section, styles.first)}>
          <div className={css(styles.details)}>
            <h1 className={css(styles.title)}>{name || 'Unnamed Snack'}</h1>
            <p>{description || 'No description'}</p>
          </div>
          <div className={css(styles.primaryButtonWrapper)}>
            <OpenWithExpoButton sdkVersion={sdkVersion} snackId={snackId} channel={channel} />
          </div>
          <div className={css(styles.secondaryButtonWrapper)}>
            <Button className={css(styles.button)} onClick={onOpenEditor}>
              Open in editor
            </Button>
          </div>
        </div>
        <div className={css(styles.section)}>
          <div className={css(styles.details)}>
            <h1 className={css(styles.title)}>Need Expo?</h1>
            <p>{`Don't have the Expo app? Download the app to try this snack.`}</p>
          </div>
          <div className={css(styles.downloadButtons)}>
            {isAndroid(userAgent) ? (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={constants.links.playstore}
                className={css(styles.download)}>
                <img
                  className={css(styles.downloadIcon)}
                  src={require('../assets/play-store-button.png')}
                />
              </a>
            ) : null}
            {isIOS(userAgent) ? (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={constants.links.itunes}
                className={css(styles.download)}>
                <img
                  className={css(styles.downloadIcon)}
                  src={require('../assets/app-store-button.png')}
                />
              </a>
            ) : null}
          </div>
        </div>
        <div className={css(styles.section, styles.qrcodeSection)}>
          <div className={css(styles.qrcodeDetails)}>
            <h1 className={css(styles.title)}>Scan with Expo</h1>
            <p>Scan the QRCode with the Expo app to try out this snack on your phone.</p>
          </div>
          <QRCode
            className={css(styles.qrcode)}
            sdkVersion={sdkVersion}
            snackId={snackId}
            channel={channel}
            size={160}
          />
        </div>
      </div>
    </div>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'auto',
    height: '100%',
    width: '100%',

    '@media (max-width: 590px)': {
      backgroundColor: '#fff',
      textAlign: 'center',
    },
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 6,
    opacity: 1,
    width: 420,
    margin: '4rem auto',
    border: '1px solid #eeeff0',

    '@media (max-width: 590px)': {
      margin: 0,
      border: 0,
      width: '100%',
    },
  },
  section: {
    borderTop: '1px solid #EEEFF0',
    padding: '3rem',
  },
  first: {
    borderTop: 0,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 500,
    color: colors.text.light,
    marginTop: 0,
  },
  primaryButtonWrapper: {
    margin: '2rem -.5em 1rem',
  },
  secondaryButtonWrapper: {
    margin: '0 -.5em -.5em',
  },
  button: {
    display: 'block',
    width: 'calc(100% - 1em)',
  },
  qrcode: {
    display: 'block',
    margin: '0 0 0 2rem',

    '@media (max-width: 590px)': {
      margin: '1rem auto 0',
    },
  },
  qrcodeSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',

    '@media (max-width: 420px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  download: {
    display: 'inline-block',
    margin: '.5rem 1rem 0 0',
    textDecoration: 'none',
  },
  downloadIcon: {
    height: 36,
  },
  downloadButtons: {
    margin: '1.5rem 0 0',
  },
});

export default AppDetails;
