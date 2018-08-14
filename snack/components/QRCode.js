/* @flow */

import * as React from 'react';

import constructExperienceURL from '../utils/constructExperienceURL';
import type { SDKVersion } from '../configs/sdk';

type Props = {
  sdkVersion: SDKVersion,
  channel: string,
  snackId: ?string,
  size?: number,
  className?: string,
};

const QRCodeRenderedOnClient = ({ sdkVersion, channel, snackId, size, className }: Props) => {
  const ReactQRCode = require('qrcode.react');
  const experienceURL = constructExperienceURL({
    sdkVersion,
    channel,
    snackId,
  });

  return (
    <div className={className}>
      <ReactQRCode value={experienceURL} size={size || 200} />
      {/* for screen readers */}
      <div style={{ fontSize: 6, color: 'transparent' }}>{experienceURL}</div>
    </div>
  );
};

export default QRCodeRenderedOnClient;
