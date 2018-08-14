/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import ShortcutLabel from './ShortcutLabel';
import withThemeName, { type ThemeName } from '../theming/withThemeName';
import colors from '../../configs/colors';

export type Action = {|
  label: string,
  handler: Function,
  disabled?: boolean,
  combo?: number[],
|};

type Props = {|
  actions: Array<?Action>,
  position: ?{
    pageX: number,
    pageY: number,
  },
  onHide: () => void,
  theme: ThemeName,
|};

const BOTTOM_OFFSET = 35;
const MENU_ITEM_HEIGHT = 28;

class ContextMenu extends React.PureComponent<Props, void> {
  render() {
    const { position, actions, theme, onHide } = this.props;

    if (!position) {
      return null;
    }

    const shownActions: any[] = actions.filter(action => action);

    return (
      <ul
        className={css(styles.menu, theme === 'dark' ? styles.menuDark : styles.menuLight)}
        style={{
          top: Math.min(
            position.pageY,
            window.innerHeight - BOTTOM_OFFSET - shownActions.length * MENU_ITEM_HEIGHT
          ),
          left: position.pageX,
        }}>
        {(shownActions: Action[]).map(({ label, handler, disabled, combo }: Action) => (
          <li key={label}>
            <button
              disabled={disabled}
              className={css(styles.item, disabled && styles.disabled)}
              onClick={() => {
                handler();
                onHide();
              }}>
              <div>{label}</div>
              {combo ? (
                <kbd className={css(styles.hint)}>
                  <ShortcutLabel combo={combo} />
                </kbd>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    );
  }
}

export default withThemeName(ContextMenu);

const styles = StyleSheet.create({
  menu: {
    position: 'fixed',
    zIndex: 10,
    listStyle: 'none',
    padding: '4px 0',
    borderWidth: 1,
    borderStyle: 'solid',
    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.16)',
    marginTop: -8,
    minWidth: 160,
  },

  menuLight: {
    backgroundColor: colors.content.light,
    borderColor: colors.border,
  },

  menuDark: {
    backgroundColor: colors.ayu.mirage.background,
    color: colors.ayu.mirage.text,
    borderColor: colors.ayu.mirage.border,
    borderWidth: 1,
    borderStyle: 'solid',
  },

  item: {
    lineHeight: 1,
    display: 'flex',
    justifyContent: 'space-between',
    appearance: 'none',
    background: 'none',
    border: 0,
    outline: 0,
    width: '100%',
    padding: '8px 16px',
    textAlign: 'left',
    userSelect: 'none',

    ':hover': {
      background: colors.primary,
      color: 'white',
    },
  },

  disabled: {
    pointerEvents: 'none',
    opacity: 0.5,
  },

  hint: {
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    marginLeft: 24,
    opacity: 0.3,
  },
});
