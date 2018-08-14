/* @flow */

import * as React from 'react';

type Props = {
  children: React.Node,
  name: string,
};

export const ThemeContext = React.createContext('light');

export default class ThemeProvider extends React.PureComponent<Props> {
  render() {
    return (
      <ThemeContext.Provider value={this.props.name}>{this.props.children}</ThemeContext.Provider>
    );
  }
}
