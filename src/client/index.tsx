import * as React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import cookies from 'js-cookie';
import PreferencesProvider from './components/Preferences/PreferencesProvider';
import ColorsProvider from './components/ColorsProvider';
import ServiceWorkerManager from './components/ServiceWorkerManager';
import Router from './components/Router';
import createStore from './redux/createStore';
import { HelmetProvider } from 'react-helmet-async';

declare const __INITIAL_DATA__: {
  data: any;
  splitTestSettings: any;
};

const store = createStore({ splitTestSettings: __INITIAL_DATA__.splitTestSettings });

class SnackEntry extends React.Component {
  render() {
    return (
      <React.StrictMode>
        <ServiceWorkerManager />
        <HelmetProvider>
          <Provider store={store}>
            <PreferencesProvider cookies={cookies} search={window.location.search}>
              <ColorsProvider>
                <BrowserRouter>
                  <Router data={__INITIAL_DATA__.data} userAgent={navigator.userAgent} />
                </BrowserRouter>
              </ColorsProvider>
            </PreferencesProvider>
          </Provider>
        </HelmetProvider>
      </React.StrictMode>
    );
  }
}

ReactDOM.hydrate(<SnackEntry />, document.getElementById('root'));
