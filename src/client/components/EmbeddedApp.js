/* @flow */

import * as React from 'react';
import App from './App';
import EmbeddedShell from './Shell/EmbeddedShell';
import type { QueryParams } from '../types';

type State = {|
  query: QueryParams,
  receivedDataEvent: boolean,
|};

export default class EmbeddedApp extends React.PureComponent<*, State> {
  state = {
    query: this.props.query,
    receivedDataEvent: false,
  };

  componentDidMount() {
    this._listenForDataEvent();
  }

  _listenForDataEvent = () => {
    const { query } = this.state;

    if (query && query.waitForData && query.iframeId) {
      const iframeId = query.iframeId;

      window.parent.postMessage(['expoFrameLoaded', { iframeId }], '*');
      window.addEventListener('message', event => {
        const eventName = event.data[0];
        const data = event.data[1];

        if (eventName === 'expoDataEvent' && data.iframeId === iframeId) {
          this.setState({
            query: { ...this.state.query, ...data },
            receivedDataEvent: true,
          });
        }
      });
    }
  };

  render() {
    const { query, receivedDataEvent } = this.state;

    if (query && query.waitForData && !receivedDataEvent) {
      return <EmbeddedShell />;
    }

    return <App {...this.props} query={query} isEmbedded />;
  }
}
