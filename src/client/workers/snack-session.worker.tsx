import { proxy } from 'web-worker-proxy';
import resources from '../../../resources.json';

declare const self: WorkerGlobalScope;

self.importScripts(resources['babel-polyfill']);

// @ts-ignore
self.window = self; // Needed for pubnub to work

// Must load this with `require` to ensure proper order
const { SnackSession } = require('snack-sdk');

let session: any;

proxy({
  create(options: any) {
    session = new SnackSession(options);
  },

  get session() {
    return session;
  },

  // By default, these methods will return a subscription object
  // We can't serialize it, so we can't call these methods directly on snack session
  // So we add separate methods for this which return undefined
  addStateListener(listener: any) {
    session.addStateListener(listener);
  },
  addPresenceListener(listener: any) {
    session.addPresenceListener(listener);
  },
  addErrorListener(listener: any) {
    session.addErrorListener(listener);
  },
  addLogListener(listener: any) {
    session.addLogListener(listener);
  },
  setDependencyErrorListener(listener: any) {
    session.dependencyErrorListener = listener;
  },
});
