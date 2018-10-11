/* @flow */

import * as React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import PreferencesProvider from './components/Preferences/PreferencesProvider';
import ColorsProvider from './components/ColorsProvider';
import ServiceWorkerManager from './components/ServiceWorkerManager';
import Router from './components/Router';
import createStore from './redux/createStore';

const store = createStore({ splitTestSettings: window.__INITIAL_DATA__.splitTestSettings });

class SnackEntry extends React.Component<{}> {
  render() {
    return (
      <React.Fragment>
        <ServiceWorkerManager />
        <Provider store={store}>
          <PreferencesProvider>
            <ColorsProvider>
              <BrowserRouter>
                <Router data={window.__INITIAL_DATA__.data} userAgent={navigator.userAgent} />
              </BrowserRouter>
            </ColorsProvider>
          </PreferencesProvider>
        </Provider>
      </React.Fragment>
    );
  }
}

/* $FlowFixMe */
ReactDOM.hydrate(<SnackEntry />, document.getElementById('root'));
