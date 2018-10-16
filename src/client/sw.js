/* @flow  */

import resources from '../../resources.json';

declare var __WEBPACK_BUILD_STATS__;

// We write the build statistics to get the hash and list of files to cache
// If you change the filename, also change the caching policy for this file on server
self.importScripts(['/dist/build-stats.js']);

// The cache name includes hash of the buildso we can maintain separate cache for separate builds
const CACHE_NAME = `cache-${process.env.BUILD_TIMESTAMP || 0}-${__WEBPACK_BUILD_STATS__.hash}`;
const ASSETS = __WEBPACK_BUILD_STATS__.assets
  // Requests will include the full URL, so use them for easier checks
  .map(item => `${self.location.origin}${item}`)
  // Don't cache the service worker itself
  .filter(url => url !== self.location.href)
  // Also add any other external resources we fetch
  .concat(Object.keys(resources).map(key => resources[key]));

self.addEventListener('install', event => {
  // Pre-cache all JavaScript, JSON and CSS code
  // This will skip any other assets such as images, they'll be cached when first requested
  // We don't have this in event.waitUntil because we don't want to wait too long before activating
  // On slower connections, it might take a long time to download all the assets during install
  // So we activate early and the assets can be downloaded when the page is loading
  caches
    .open(CACHE_NAME)
    .then(cache => cache.addAll(ASSETS.filter(item => /\.(css|js|json)$/.test(item))));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Get all the existing cache
    caches.keys().then(names =>
      // Delete any outdated cache
      Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)))
    )
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method === 'GET' && ASSETS.includes(event.request.url)) {
    // We got a request for an asset we manage
    return event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        // Check the cache for the item
        return cache.match(event.request).then(response => {
          // If the item exists in the cache, return it, else do a network request
          return (
            response ||
            fetch(event.request).then(res => {
              cache.put(event.request, res.clone());
              return res;
            })
          );
        });
      })
    );
  }
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    // The client will let us know when the service worker is ready to take over
    self.skipWaiting();
  }
});
