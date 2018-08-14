/* @flow */

import * as React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Router from './components/Router';
import createStore from './redux/createStore';

const store = createStore(window.__INITIAL_DATA__);

class SnackEntry extends React.Component<{}> {
  render() {
    return (
      <Provider store={store}>
        <Router />
      </Provider>
    );
  }
}

/* $FlowFixMe */
ReactDOM.render(<SnackEntry />, document.getElementById('root'));

// Register the service worker
if ('serviceWorker' in navigator && navigator.serviceWorker) {
  navigator.serviceWorker.register('/dist/sw.bundle.js', {
    scope: '/',
  });
}
