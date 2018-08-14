/* @flow */

import findKey from 'lodash/findKey';
import { KeyMap } from './KeybindingsManager';

type Props = {|
  combo: number[],
|};

type KeyName = $Keys<typeof KeyMap>;

const isMac = 'navigator' in global && /Mac/i.test(navigator.platform);

const KeyLabels: { [name: KeyName]: string } = {
  Cmd: '⌘',
  Delete: '⌫',
  Enter: '↩',
  Shift: '⇧',
  Ctrl: isMac ? '⌃' : 'Ctrl',
  Alt: isMac ? '⌥' : 'Alt',
  Backslash: '\\',
  Tilde: '`',
};

export default function ShortcutLabel({ combo }: Props) {
  return combo
    .map(code => {
      const name = findKey(KeyMap, c => c === code);

      /* $FlowFixMe */
      if (name && KeyLabels[name]) {
        return KeyLabels[name];
      } else {
        return name;
      }
    })
    .join(isMac ? '' : '+');
}
