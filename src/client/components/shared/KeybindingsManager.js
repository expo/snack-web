/* @flow */

import * as React from 'react';

type Binding = {
  type: string,
  combo: number[],
};

type Props = {|
  bindings: Array<Binding>,
  onTrigger: (binding: Binding) => mixed,
|};

const isMac = 'navigator' in global && /Mac/i.test(navigator.platform);

export const KeyMap = {
  C: 67,
  D: 68,
  F: 70,
  S: 83,
  V: 86,
  F2: 113,
  Delete: 8,
  Enter: 13,
  Escape: 27,
  Shift: 16,
  Ctrl: 17,
  Alt: 18,
  Cmd: 91,
  Tilde: 192,
  Backslash: 220,
  Meta: isMac ? 91 : 17,
};

export const isKeyCombo = (e: KeyboardEvent, combo: number[]) =>
  combo.every(code => {
    switch (code) {
      case KeyMap.Ctrl:
        return e.ctrlKey;
      case KeyMap.Meta:
        return e.metaKey;
      case KeyMap.Alt:
        return e.altKey;
      default:
        return e.keyCode === code;
    }
  });

export default class KeybindingsManager extends React.PureComponent<Props, void> {
  componentDidMount() {
    document.addEventListener('keydown', this._handleKeydown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this._handleKeydown);
  }

  _handleKeydown = (e: KeyboardEvent) => {
    for (const binding of this.props.bindings) {
      if (isKeyCombo(e, binding.combo)) {
        e.preventDefault();

        this.props.onTrigger(binding);

        break;
      }
    }
  };

  render() {
    return null;
  }
}
