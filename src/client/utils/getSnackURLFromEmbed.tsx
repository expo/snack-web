import compact from 'lodash/compact';

export default function getSnackURLFromEmbed(sessionID: string) {
  const protocol = window.location.protocol;
  const host = window.location.host;
  const search = window.location.search ? window.location.search.replace(/^\?/, '&') : '';

  const pathname = compact(window.location.pathname.split('/'));
  pathname.shift();

  return `${protocol}//${host}/${pathname.join('/')}?session_id=${sessionID}${search}`;
}
