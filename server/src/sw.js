/* @flow */

export default function sw() {
  // Since the service worker is served from /dist/, we need to set this header to allow it to control the page
  return async (ctx: *, next: *) => {
    ctx.set('Service-Worker-Allowed', '/');
    await next();
  };
}
