/* @flow */

import { proxy } from 'web-worker-proxy';
import resources from '../../../resources.json';

self.importScripts(resources['babel-polyfill']);

self.window = self; // Needed for pubnub to work

// Must load this with `require` to ensure proper order
const { SnackSession } = require('snack-sdk');

let session;

proxy({
  create(options) {
    session = new SnackSession(options);
  },

  get session() {
    return session;
  },

  // By default, these methods will return a subscription object
  // We can't serialize it, so we can't call these methods directly on snack session
  // So we add separate methods for this which return undefined
  addStateListener(listener: *) {
    session.addStateListener(listener);
  },
  addPresenceListener(listener: *) {
    session.addPresenceListener(listener);
  },
  addErrorListener(listener: *) {
    session.addErrorListener(listener);
  },
  addLogListener(listener: *) {
    session.addLogListener(listener);
  },
  setDependencyErrorListener(listener: *) {
    session.dependencyErrorListener = listener;
  },
});
