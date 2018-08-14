/* @flow */

import * as React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { ThemeContext } from './ThemeProvider';

export type ThemeName = 'light' | 'dark';

// react-redux doesn't work with forwardRef: https://github.com/reduxjs/react-redux/issues/914
// so this HOC always needs wrap a connect call, and a connect call cannot wrap this
export default function withThemeName<C: React.ComponentType<*>>(
  Comp: C
): React.ComponentType<$Diff<React.ElementConfig<C>, { theme: ThemeName }>> {
  class ThemedComponent extends React.Component<*> {
    static displayName = `withTheme(${Comp.displayName || Comp.name})`;

    render() {
      const { forwardedRef, ...rest } = this.props;

      return (
        <ThemeContext.Consumer>
          {theme => <Comp ref={forwardedRef} theme={theme} {...rest} />}
        </ThemeContext.Consumer>
      );
    }
  }

  /* $FlowIssue: Flow doesn't know about forwardRef yet */
  const Result = React.forwardRef((props, ref) => (
    <ThemedComponent {...props} forwardedRef={ref} />
  ));

  hoistNonReactStatics(Result, Comp);

  return Result;
}
