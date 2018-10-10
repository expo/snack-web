/* @flow */

import * as React from 'react';
import { FormValidationContext } from './Form';

type State = {
  initial: boolean,
  error: ?Error,
  value: any,
};

export default function withValidation<C: React.ComponentType<*>>(
  Comp: C
): React.ComponentType<
  $Diff<React.ElementConfig<C>, { error: ?Error }> & { validate: (value: *) => ?Error }
> {
  class EnhancedComponent extends React.Component<*, State> {
    static displayName = `withValidation(${Comp.displayName || Comp.name})`;

    static getDerivedStateFromProps(nextProps, prevState) {
      const initial = prevState.value !== nextProps.value ? false : prevState.initial;

      return {
        initial,
        error: initial ? null : nextProps.validate ? nextProps.validate(nextProps.value) : null,
        value: nextProps.value,
      };
    }

    state = {
      initial: true,
      error: null,
      value: this.props.value,
    };

    _key: number;
    _root: any;

    componentDidMount() {
      this._key = this.props.validation.register({
        validate: this._validate,
        focus: this._focus,
      });
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevProps.value !== this.props.value) {
        this.props.validation.update();
      }
    }

    componentWillUnmount() {
      this.props.validation.unregister(this._key);
    }

    _validate = () => this.props.validate(this.props.value);

    _focus = () => {
      this._root.focus && this._root.focus();

      if (this.state.initial) {
        this.setState({
          initial: false,
          error: this.props.validate(this.props.value),
        });
      }
    };

    render() {
      return <Comp ref={c => (this._root = c)} error={this.state.error} {...this.props} />;
    }
  }

  return props => (
    <FormValidationContext.Consumer>
      {value => <EnhancedComponent validation={value} {...props} />}
    </FormValidationContext.Consumer>
  );
}
