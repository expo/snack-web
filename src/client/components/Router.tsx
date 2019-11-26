import * as React from 'react';
import { Switch, Route } from 'react-router-dom';
import { parse } from 'query-string';
import App from './App';
import EmbeddedApp from './EmbeddedApp';
import NonExistent from './NonExistent';

type Props = {
  data:
    | {
        type: 'success';
        snack: object | null;
      }
    | {
        type: 'error';
        error: {
          message: string;
        };
      }
    | null;
  postData: object | null;
  userAgent: string;
};

export default class Router extends React.Component<Props> {
  _renderRoute = (props: any) => {
    const { data, ...rest } = this.props;
    const isEmbedded = props.location.pathname.split('/')[1] === 'embedded';

    let hasPostData = this.props.postData && Object.keys(this.props.postData).length;
    let query = hasPostData ? this.props.postData : parse(props.location.search);

    if (data && data.type === 'success') {
      if (isEmbedded) {
        return <EmbeddedApp {...props} {...rest} query={query} snack={data.snack} />;
      }

      return <App {...props} {...rest} query={query} snack={data.snack} />;
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
