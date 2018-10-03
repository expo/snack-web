/* @flow */

import * as React from 'react';

type Props = {
  load: () => Promise<any>,
  children: ({ loaded: boolean, data: any }) => any,
};

type State = {
  data: ?any,
};

export default class LazyLoad extends React.Component<Props, State> {
  state = {
    data: null,
  };

  componentDidMount() {
    this._load();
  }

  _load = async () => {
    let data = await this.props.load();

    if (data.__esModule) {
      data = data.default;
    }

    this.setState({ data });
  };

  render() {
    return this.props.children(
      this.state.data ? { loaded: true, data: this.state.data } : { loaded: false, data: null }
    );
  }
}
