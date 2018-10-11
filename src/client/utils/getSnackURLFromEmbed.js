/* @flow */

import compact from 'lodash/compact';
const EMBEDDED_PATH = 'embedded';

export default function getSnackURLFromEmbed(sessionID: string) {
  const protocol = window.location.protocol;
  const host = window.location.host;
  let pathname = compact(window.location.pathname.split('/'));
  pathname.shift();
  pathname = pathname.join('/');

  return `${protocol}//${host}/${pathname}?session_id=${sessionID}`;
}
