/* @flow */

import * as React from 'react';
import { FormValidationContext } from './Form';

export default function withStatus<C: React.ComponentType<*>>(
  Comp: C
): React.ComponentType<$Diff<React.ElementConfig<C>, { disabled: boolean }>> {
  function withStatus(props) {
    return (
      <FormValidationContext.Consumer>
        {(value = { valid: true }) => <Comp disabled={!value.valid} {...props} />}
      </FormValidationContext.Consumer>
    );
  }

  withStatus.displayName = `withValidation(${Comp.displayName || Comp.name})`;

  return withStatus;
}
