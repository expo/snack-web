/* @flow */

import * as React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import PreferencesProvider from './components/Preferences/PreferencesProvider';
import ServiceWorkerManager from './components/ServiceWorkerManager';
import Router from './components/Router';
import createStore from './redux/createStore';

const store = createStore(window.__INITIAL_DATA__);

class SnackEntry extends React.Component<{}> {
  render() {
    return (
      <React.Fragment>
        <ServiceWorkerManager />
        <Provider store={store}>
          <PreferencesProvider>
            <Router />
          </PreferencesProvider>
        </Provider>
      </React.Fragment>
    );
  }
}

/* $FlowFixMe */
ReactDOM.render(<SnackEntry />, document.getElementById('root'));
