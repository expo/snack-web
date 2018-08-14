/* @flow */

import * as React from 'react';
import nullthrows from 'nullthrows';
import type { Snack } from '../types';

type Status =
  | { type: 'fetching', id: string }
  | { type: 'done', id: string, data: Snack }
  | { type: 'error', id: string, error: Error }
  | { type: 'idle', data: null };

type Props = {
  params?: {
    id: ?string,
    username: ?string,
    projectName: ?string,
  },
  render: (status: Status) => React.Node,
};

type State = {
  status: Status,
};

const getSnackId = (params: *) => {
  if (params) {
    return params.id
      ? params.id
      : params.username && params.projectName ? `@${params.username}/${params.projectName}` : null;
  }

  return null;
};

export default class SnackDataManager extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props, state: State) {
    const id = getSnackId(props.params);

    if (id) {
      const { status } = state;

      // TODO(satya164):
      // Only fetch data for the first time.
      // We won't fetch data again when id changes.
      // This is to prevent re-rendering a different route.
      // Revisit again in future.
      if (status.type === 'idle') {
        return {
          status: { type: 'fetching', id },
        };
      }

      return state;
    } else {
      return {
        status: { type: 'done', data: null },
      };
    }
  }

  state = {
    status: { type: 'idle', data: null },
  };

  componentDidMount() {
    const { status } = this.state;

    if (status && status.type === 'fetching') {
      this._fetchData(status.id);
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.status !== this.state.status) {
      const { status } = this.state;

      if (status && status.type === 'fetching') {
        this._fetchData(status.id);
      }
    }
  }

  _getSnackId = (params: *) => {
    if (params) {
      return params.id
        ? params.id
        : params.username && params.projectName
          ? `@${params.username}/${params.projectName}`
          : null;
    }

    return null;
  };

  _fetchData = async (id: string) => {
    try {
      const response = await fetch(
        `${nullthrows(process.env.API_SERVER_URL)}/--/api/v2/snack/${id}`,
        {
          headers: { 'Snack-Api-Version': '3.0.0' },
        }
      );
      const text = await response.text();
      const snack = JSON.parse(text);

      if (snack.errors && snack.errors.length) {
        this.setState({
          status: {
            type: 'error',
            id,
            error: new Error('Server returned errors when fetching data'),
          },
        });
      } else {
        this.setState({
          status: { type: 'done', id, data: snack },
        });
      }
    } catch (error) {
      this.setState({
        status: { type: 'error', id, error },
      });
    }
  };

  render() {
    const { status } = this.state;

    if (status) {
      return this.props.render(status);
    }
  }
}
