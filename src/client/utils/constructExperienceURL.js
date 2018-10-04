/* @flow */

import type { SDKVersion } from '../configs/sdk';
import constants from '../configs/constants';

type Props = {
  sdkVersion: SDKVersion,
  channel: string,
  snackId?: ?string,
  host?: string,
};

export default function constructExperienceURL({
  sdkVersion,
  snackId,
  channel,
  // For testing
  host = typeof window !== 'undefined' ? window.location.host : '',
}: Props) {
  let hostWithoutSubdomain;

  if (host.includes('next-snack.expo.io')) {
    hostWithoutSubdomain = host.replace('next-snack.expo.io', 'expo.io');
  } else if (host.includes('snack.expo.io')) {
    hostWithoutSubdomain = host.replace('snack.expo.io', 'expo.io');
  } else if (host.includes('snack.expo.test')) {
    hostWithoutSubdomain = constants.ngrok;
  } else {
    hostWithoutSubdomain = host;
  }

  // If we are at a saved snack and have an id, go to that experience id.
  // Otherwise tell the server to give us the blank snack experience at SDK_VERSION,
  // and append a uuid to the url so that two different users starting a new snack
  // have different ids.
  let result = snackId
    ? snackId.startsWith('@')
      ? `exp://${hostWithoutSubdomain}/${snackId}+${channel}`
      : `exp://${hostWithoutSubdomain}/@snack/${snackId}+${channel}`
    : `exp://${hostWithoutSubdomain}/@snack/sdk.${sdkVersion}-${channel}`;
  return result;
}
