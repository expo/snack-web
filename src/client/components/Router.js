/* @flow */

import * as React from 'react';
import { Switch, Route } from 'react-router-dom';
import { parse } from 'query-string';
import App from './App';
import EmbeddedApp from './EmbeddedApp';
import NonExistent from './NonExistent';

type Props = {
  data:
    | {
        type: 'success',
        snack: ?Object,
      }
    | {
        type: 'error',
        error: { message: string },
      }
    | null,
  userAgent: string,
};

export default class Router extends React.Component<Props> {
  _renderRoute = (props: *) => {
    const data = this.props.data;
    const isEmbedded = props.location.pathname.split('/')[1] === 'embedded';

    if (data && data.type === 'success') {
      if (isEmbedded) {
        return <EmbeddedApp {...props} query={parse(props.location.search)} snack={data.snack} />;
      }

      return <App {...props} query={parse(props.location.search)} snack={data.snack} />;
    } else {
      return <NonExistent />;
    }
  };

  render() {
    return (
      <Switch>
        <Route exact path="/embedded/@:username/:projectName+" render={this._renderRoute} />
        <Route exact path="/embedded/:id" render={this._renderRoute} />
        <Route exact path="/embedded" render={this._renderRoute} />
        <Route exact path="/@:username/:projectName+" render={this._renderRoute} />
        <Route exact path="/:id" render={this._renderRoute} />
        <Route exact path="/" render={this._renderRoute} />
        <Route component={NonExistent} />
      </Switch>
    );
  }
}
