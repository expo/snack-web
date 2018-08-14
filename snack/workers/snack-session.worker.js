/* @flow */

self.window = self; // needed for pubnub to work

const nullthrows = require('nullthrows').default;
const { SnackSession } = require('snack-sdk');

let snackSession;

self.addEventListener('message', event => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT': {
      // Initialize the snack session
      snackSession = new SnackSession(payload);
      snackSession.expoApiUrl = nullthrows(process.env.API_SERVER_URL);

      snackSession.addStateListener(state => self.postMessage({ type: 'STATE', payload: state }));

      snackSession.addPresenceListener(event =>
        self.postMessage({ type: 'PRESENCE', payload: event })
      );

      snackSession.addErrorListener(errors => self.postMessage({ type: 'ERROR', payload: errors }));

      snackSession.addLogListener(log => self.postMessage({ type: 'LOG', payload: log }));

      snackSession.dependencyErrorListener = error =>
        self.postMessage({ type: 'DEPENDENCY_ERROR', payload: error });

      // Send the initial details
      self.postMessage({ type: 'STATE', payload: snackSession.getState() });
      self.postMessage({ type: 'CHANNEL', payload: snackSession.getChannel() });

      break;
    }

    case 'START':
      snackSession.startAsync();
      break;

    case 'SAVE': {
      snackSession.saveAsync().then(
        result => {
          self.postMessage({
            type: 'SAVE_SUCCESS',
            payload: {
              version: payload.version,
              result,
            },
          });
        },
        error => {
          self.postMessage({
            type: 'SAVE_ERROR',
            payload: {
              version: payload.version,
              error,
            },
          });
        }
      );

      break;
    }

    case 'UPLOAD_ASSET': {
      snackSession.uploadAssetAsync(payload.data).then(
        result => {
          self.postMessage({
            type: 'UPLOAD_ASSET_SUCCESS',
            payload: {
              version: payload.version,
              result,
            },
          });
        },
        error => {
          self.postMessage({
            type: 'UPLOAD_ASSET_ERROR',
            payload: {
              version: payload.version,
              error,
            },
          });
        }
      );

      break;
    }

    case 'SYNC_DEPENDENCIES': {
      snackSession
        .syncDependenciesAsync(payload.data, (...args) => {
          self.postMessage({
            type: 'SYNC_DEPENDENCIES_CALLBACK',
            payload: {
              version: payload.version,
              args,
            },
          });
        })
        .then(
          result => {
            self.postMessage({
              type: 'SYNC_DEPENDENCIES_SUCCESS',
              payload: {
                version: payload.version,
                result,
              },
            });
          },
          error => {
            self.postMessage({
              type: 'SYNC_DEPENDENCIES_ERROR',
              payload: {
                version: payload.version,
                error,
              },
            });
          }
        );

      break;
    }

    case 'SEND_CODE':
      snackSession.sendCodeAsync(payload);
      break;

    case 'SET_PROPERTIES':
      Object.keys(payload).forEach(key => {
        /* $FlowFixMe */
        snackSession[key] = payload[key];
      });
      break;

    case 'SET_SDK_VERSION':
      snackSession.setSdkVersion(payload);
      break;

    case 'SET_USER':
      snackSession.setUser(payload);
      break;

    case 'SET_NAME':
      snackSession.setName(payload);
      break;

    case 'SET_DESCRIPTION':
      snackSession.setDescription(payload);
      break;

    case 'SET_DEVICE_ID':
      snackSession.setDeviceId(payload);
      break;
  }
});

self.postMessage({ type: 'READY' });
