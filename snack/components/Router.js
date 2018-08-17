/* @flow */

import * as React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { parse } from 'query-string';
import SnackDataManager from './SnackDataManager';
import AppShell from './Shell/AppShell';
import EmbeddedShell from './Shell/EmbeddedShell';
import App from './App';
import EmbeddedApp from './EmbeddedApp';
import NonExistent from './NonExistent';

export default class Router extends React.Component<{}> {
  _renderRoute = (props: *) => (
    <SnackDataManager
      params={props.match.params}
      render={status => {
        const isEmbedded = props.location.pathname.split('/')[1] === 'embedded';

        switch (status.type) {
          case 'idle':
          case 'done':
            if (isEmbedded) {
              return (
                <EmbeddedApp {...props} query={parse(props.location.search)} snack={status.data} />
              );
            }

            return <App {...props} query={parse(props.location.search)} snack={status.data} />;
          case 'error':
            return <NonExistent />;
          default:
            if (isEmbedded) {
              return <EmbeddedShell />;
            }

            return <AppShell />;
        }
      }}
    />
  );

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/embedded/@:username/:projectName+" render={this._renderRoute} />
          <Route exact path="/embedded/:id" render={this._renderRoute} />
          <Route exact path="/embedded" render={this._renderRoute} />
          <Route exact path="/@:username/:projectName+" render={this._renderRoute} />
          <Route exact path="/:id" render={this._renderRoute} />
          <Route exact path="/" render={this._renderRoute} />
          <Route component={NonExistent} />
        </Switch>
      </BrowserRouter>
    );
  }
}
