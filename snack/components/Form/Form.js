/* @flow */

import * as React from 'react';

type Props = {
  onSubmit: () => mixed,
  children: React.Node,
};

type State = {
  isValid: boolean,
};

export const FormValidationContext = React.createContext(undefined);

export default class Form extends React.Component<Props, State> {
  state = {
    isValid: false,
  };

  componentDidMount() {
    this._update();
  }

  _key = 0;
  _inputs: Array<{ key: number, validate: () => ?Error, focus: () => mixed }> = [];

  _register = ({ validate, focus }: { validate: () => ?Error, focus: () => mixed }) => {
    const key = this._key++;

    this._inputs.push({
      key,
      validate,
      focus,
    });

    return key;
  };

  _unregister = (key: number) => {
    this._inputs = this._inputs.filter(it => it.key !== key);
  };

  _update = () =>
    this.setState({
      isValid: this._inputs.every(it => !it.validate()),
    });

  _handleSubmit = (e: *) => {
    e.preventDefault();

    for (const input of this._inputs) {
      if (input.validate()) {
        input.focus();
        return;
      }
    }

    this.props.onSubmit();
  };

  render() {
    return (
      <FormValidationContext.Provider
        value={{
          register: this._register,
          unregister: this._unregister,
          update: this._update,
          valid: this.state.isValid,
        }}>
        <form onSubmit={this._handleSubmit}>{this.props.children}</form>
      </FormValidationContext.Provider>
    );
  }
}
