import { proxy } from 'web-worker-proxy';
import resources from '../../../resources.json';

declare const self: WorkerGlobalScope;

self.importScripts(resources['babel-polyfill']);

// @ts-ignore
self.window = self; // Needed for pubnub to work

// Must load this with `require` to ensure proper order
const { SnackSession } = require('snack-sdk');

const player: {
  subscribe?: () => void;
  unsubscribe?: () => void;
  publish?: (message: any) => void;
  listen?: (message: any) => void;
} = {};

const listeners: any[] = [];

let session: any;

proxy({
  create(options: any) {
    session = new SnackSession({
      ...options,
      player: {
        subscribe: () => player.subscribe && player.subscribe(),
        unsubscribe: () => player.unsubscribe && player.unsubscribe(),
        publish: (message: string) => player.publish && player.publish(message),
        listen: (callback: (payload: { message: any }) => void) => {
          listeners.push(callback);
        },
      },
    });
  },

  get session() {
    return session;
  },

  sendMessage(message: string) {
    listeners.forEach(listener => listener(message));
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

  setPlayerSubscribe(subscribe: any) {
    player.subscribe = subscribe;
  },
  setPlayerUnsubscribe(unsubscribe: any) {
    player.unsubscribe = unsubscribe;
  },
  setPlayerPublish(publish: any) {
    player.publish = publish;
  },
});
