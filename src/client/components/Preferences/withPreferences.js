/* @flow */

import * as React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { PreferencesContext, type PreferencesType } from './PreferencesProvider';

export type PreferencesContextType = {
  setPreferences: (overrides: $Shape<PreferencesType>) => void,
  preferences: PreferencesType,
};

// react-redux doesn't work with forwardRef: https://github.com/reduxjs/react-redux/issues/914
// so this HOC always needs wrap a connect call, and a connect call cannot wrap this
export default function withPreferences<C: React.ComponentType<*>>(
  Comp: C
): React.ComponentType<$Diff<React.ElementConfig<C>, PreferencesContextType>> {
  class PreferenceConsumerComponent extends React.Component<*> {
    static displayName = `withPreferences(${Comp.displayName || Comp.name})`;

    render() {
      const { forwardedRef, ...rest } = this.props;

      return (
        <PreferencesContext.Consumer>
          {props => <Comp ref={forwardedRef} {...props} {...rest} />}
        </PreferencesContext.Consumer>
      );
    }
  }

  /* $FlowIssue: Flow doesn't know about forwardRef yet */
  const Result = React.forwardRef((props, ref) => (
    <PreferenceConsumerComponent {...props} forwardedRef={ref} />
  ));

  hoistNonReactStatics(Result, Comp);

  return Result;
}
