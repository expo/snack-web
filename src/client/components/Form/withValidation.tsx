import * as React from 'react';
import { FormValidationContext, FormValidation } from './Form';
import { $Subtract } from '../../types';

type Props = {
  value: any;
  validate: (value: any) => Error | null;
  validation: FormValidation;
};

type State = {
  initial: boolean;
  error: Error | null;
  value: any;
};

type InjectedProps = {
  error: Error | null | undefined;
};

export default function withValidation<P extends InjectedProps>(
  Comp: React.ComponentType<P>
): React.ComponentType<$Subtract<P, InjectedProps>> {
  class EnhancedComponent extends React.Component<Props, State> {
    static displayName = `withValidation(${Comp.displayName || Comp.name})`;

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
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

    _key: number = 0;
    _root = React.createRef<any>();

    componentDidMount() {
      this._key = this.props.validation.register({
        validate: this._validate,
        focus: this._focus,
      });
    }

    componentDidUpdate(prevProps: Props) {
      if (prevProps.value !== this.props.value) {
        this.props.validation.update();
      }
    }

    componentWillUnmount() {
      this.props.validation.unregister(this._key);
    }

    _validate = () => this.props.validate(this.props.value);

    _focus = () => {
      this._root.current.focus && this._root.current.focus();

      if (this.state.initial) {
        this.setState({
          initial: false,
          error: this.props.validate(this.props.value),
        });
      }
    };

    render() {
      // @ts-ignore
      return <Comp ref={this._root} error={this.state.error} {...this.props} />;
    }
  }

  return props => (
    <FormValidationContext.Consumer>
      {(value: any) => {
        // @ts-ignore
        return <EnhancedComponent validation={value} {...props} />;
      }}
    </FormValidationContext.Consumer>
  );
}
