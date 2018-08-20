/* @flow */

import * as React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { PreferencesContext } from './PreferencesProvider';

export type ThemeName = 'light' | 'dark';

// react-redux doesn't work with forwardRef: https://github.com/reduxjs/react-redux/issues/914
// so this HOC always needs wrap a connect call, and a connect call cannot wrap this
export default function withThemeName<Props: *, C: React.ComponentType<Props>>(
  Comp: C
): React.ComponentType<$Diff<React.ElementConfig<C>, { theme: ThemeName }>> {
  class ThemedComponent extends React.Component<*> {
    static displayName = `withTheme(${Comp.displayName || Comp.name})`;

    render() {
      const { forwardedRef, ...rest } = this.props;

      return (
        <PreferencesContext.Consumer>
          {props => <Comp ref={forwardedRef} theme={props.preferences.theme} {...rest} />}
        </PreferencesContext.Consumer>
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
