/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import SegmentedButton from '../shared/SegmentedButton';
import ButtonLink from '../shared/ButtonLink';
import ModalDialog from '../shared/ModalDialog';

import AccountTab from './AccountTab';
import QRCodeTab from './QRCodeTab';
import DeviceIDTab from './DeviceIDTab';
import constants from '../../configs/constants';
import type { SDKVersion } from '../../configs/sdk';

export type EmbeddedConnectionMethod = 'device-id' | 'qr-code';
export type ConnectionMethod = 'account' | EmbeddedConnectionMethod;

type Props = {|
  isEmbedded: boolean,
  sdkVersion: SDKVersion,
  channel: string,
  snackId: ?string,
  method: ConnectionMethod,
  onSignIn?: () => Promise<void>,
  onChangeMethod:
    | ((method: ConnectionMethod) => mixed)
    | ((method: EmbeddedConnectionMethod) => mixed),
  onDismiss: () => mixed,
  setDeviceId: (deviceId: string) => Promise<void>,
  wasUpgraded?: boolean,
  deviceId: ?string,
  visible: boolean,
  large?: boolean,
|};

export default class DeviceInstructionsModal extends React.Component<Props> {
  render() {
    const {
      large,
      visible,
      onDismiss,
      onChangeMethod,
      onSignIn,
      setDeviceId,
      deviceId,
      method,
      isEmbedded,
      wasUpgraded,
      snackId,
      sdkVersion,
      channel,
    } = this.props;
    // Avoid using the snack id to run the experience on a device so that outdated snacks fetch a version the
    // latest client is able to run
    const connectionSnackId = wasUpgraded ? null : snackId;

    let segments = [
      { id: 'device-id', text: 'Device ID' },
      ...(!isEmbedded ? [{ id: 'account', text: 'Account' }] : []),
      { id: 'qr-code', text: 'QR Code' },
    ];

    // TODO: how do we handle people visiting from their mobile device?
    // used to show a button, maybe makes less sense now that we don't open the modal
    // automatically

    return (
      <ModalDialog
        className={css(large && styles.large)}
        autoSize={!large}
        visible={visible}
        title={large ? undefined : 'Run on your device'}
        onDismiss={onDismiss}>
        <div className={css(styles.container)}>
          <SegmentedButton
            selectedId={method}
            onSelect={(id: any) => onChangeMethod(id)}
            segments={segments}
          />
          <div className={css(styles.wrapper)}>
            <div
              className={css(styles.pages)}
              style={{
                left: `${-segments.findIndex(s => s.id === method) * 100}%`,
              }}>
              {segments.map(({ id }) => {
                let content;

                switch (id) {
                  case 'device-id':
                    content = (
                      <DeviceIDTab key={id} deviceId={deviceId} setDeviceId={setDeviceId} />
                    );
                    break;
                  case 'account':
                    content = (
                      <AccountTab
                        key={id}
                        isEmbedded={isEmbedded}
                        sdkVersion={sdkVersion}
                        channel={channel}
                        snackId={connectionSnackId}
                        onSuccess={onSignIn}
                      />
                    );
                    break;
                  case 'qr-code':
                    content = (
                      <QRCodeTab
                        key={id}
                        sdkVersion={sdkVersion}
                        channel={channel}
                        snackId={connectionSnackId}
                      />
                    );
                    break;
                }

                return (
                  <div
                    key={id}
                    className={css(styles.page)}
                    style={{ visibility: id === method ? 'visible' : 'hidden' }}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
          <div className={css(styles.downloadButtons)}>
            <ButtonLink
              target="_blank"
              href={constants.links.itunes}
              className={css(styles.button, styles.appstore)}>
              Get iOS App
            </ButtonLink>
            <ButtonLink
              target="_blank"
              href={constants.links.playstore}
              className={css(styles.button, styles.playstore)}>
              Get Android App
            </ButtonLink>
          </div>
        </div>
      </ModalDialog>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    maxWidth: 600,
  },
  title: {
    fontSize: '2em',
    fontWeight: 500,
  },
  button: {
    flex: 1,
    display: 'block',
    width: 208,
    margin: '.5em',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '.5em center',
    '-webkit-font-smoothing': 'initial',
  },
  appstore: {
    backgroundImage: `url(${require('../../assets/app-store-icon.png')})`,
    backgroundSize: '12px 23px',
  },
  playstore: {
    backgroundImage: `url(${require('../../assets/play-store-icon.png')})`,
    backgroundSize: '20px 23px',
  },
  whyNoQRCode: {
    opacity: 0.5,
    marginTop: '15px',
    marginBottom: '5px',
  },
  large: {
    minWidth: 0,
    minHeight: 0,
    maxWidth: 'calc(100% - 48px)',
    maxHeight: 'calc(100% - 48px)',
  },
  wrapper: {
    width: '100%',
    overflowX: 'hidden',
    marginTop: 16,
  },
  pages: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    width: '300%',
  },
  page: {
    width: 'calc(100% / 3)',
    display: 'block',
    textAlign: 'center',
  },
  downloadButtons: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginTop: 12,
  },
});
