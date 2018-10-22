/* @flow */

import * as React from 'react';
import classnames from 'classnames';
import { StyleSheet, css } from 'aphrodite';
import ShortcutLabel from './ShortcutLabel';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import { c } from '../ColorsProvider';

export type Action = {|
  label: string,
  handler: () => mixed,
  disabled?: boolean,
  combo?: number[],
|};

type Props = {|
  visible: boolean,
  actions: Array<?Action>,
  position?: ?{
    pageX: number,
    pageY: number,
  },
  onHide: () => void,
  className?: string,
  theme: ThemeName,
|};

const BOTTOM_OFFSET = 35;
const MENU_ITEM_HEIGHT = 28;

class ContextMenu extends React.PureComponent<Props, void> {
  render() {
    const { visible, position, actions, theme, onHide, className } = this.props;

    if (!visible) {
      return null;
    }

    const shownActions: any[] = actions.filter(action => action);

    return (
      <ul
        className={classnames(
          css(styles.menu, theme === 'dark' ? styles.menuDark : styles.menuLight),
          className
        )}
        style={
          position
            ? {
                position: 'fixed',
                top: Math.min(
                  position.pageY,
                  window.innerHeight - BOTTOM_OFFSET - shownActions.length * MENU_ITEM_HEIGHT
                ),
                left: position.pageX,
                marginTop: -8,
              }
            : {}
        }>
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

const fadeIn = {
  from: { opacity: 0 },
  to: { opacity: 1 },
};

const styles = StyleSheet.create({
  menu: {
    zIndex: 10,
    listStyle: 'none',
    padding: 4,
    borderRadius: 3,
    borderStyle: 'solid',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.16)',
    minWidth: 160,
    animationName: fadeIn,
    animationDuration: '0.083s',
    animationTimingfunction: 'linear',
    backgroundColor: c('content'),
    borderColor: c('editor-border'),
    color: c('text'),
  },

  menuLight: {
    borderWidth: 0,
  },

  menuDark: {
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
    padding: '8px 12px',
    textAlign: 'left',
    userSelect: 'none',
    borderRadius: 2,

    ':hover': {
      background: c('primary'),
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
