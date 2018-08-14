/* @flow  */

import resources from '../resources.json';

declare var __WEBPACK_BUILD_STATS__;

// We write the build statistics to get the hash and list of files to cache
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
  // We don't have this in event.waitUntil because it's not critical to have these before install
  // These can be fetched later after the service worker is installed
  caches
    .open(CACHE_NAME)
    .then(cache => cache.addAll(ASSETS.filter(item => /\.(css|js|json)$/.test(item))))
    .then(() => {
      // Activate the service worker when the cache is ready
      self.skipWaiting();
    });
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
