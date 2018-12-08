import * as React from 'react';
import { FormValidationContext } from './Form';
import { $Subtract } from '../../types';

type InjectedProps = {
  disabled: boolean | undefined;
};

export default function withStatus<P extends InjectedProps>(
  Comp: React.ComponentType<P>
): React.ComponentType<$Subtract<P, InjectedProps>> {
  function withStatus(props: any) {
    return (
      <FormValidationContext.Consumer>
        {(value: { valid: boolean } | undefined = { valid: true }) => (
          <Comp disabled={!value.valid} {...props} />
        )}
      </FormValidationContext.Consumer>
    );
  }

  withStatus.displayName = `withValidation(${Comp.displayName || Comp.name})`;

  return withStatus;
}
