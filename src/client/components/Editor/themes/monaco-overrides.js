/* @flow */

import { light, dark } from './monaco';
import colors from '../../../configs/colors';
import * as lightColors from './colors-light';
import * as darkColors from './colors-dark';
import constants from '../../../configs/constants';
import { c } from '../../ColorsProvider';

const css: any = String.raw;

export default css`
  /* Common overrides */
  .snack-monaco-editor .monaco-editor .line-numbers {
    color: currentColor;
    opacity: 0.5;
  }

  /* Context menu overrides */
  .snack-monaco-editor .context-view.monaco-menu-container {
    font-family: 'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    padding: 4px;
    border-radius: 3px;
    border-style: solid;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.16);
  }

  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .action-item {
    border-radius: 2px;
  }

  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .action-item .action-label,
  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .action-item .action-label:focus {
    font-size: 14px;
    line-height: 1;
    color: inherit;
  }

  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .action-item .action-label:focus {
    color: inherit !important;
    text-shadow: none !important;
  }

  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .action-item.disabled {
    pointer-events: none;
  }

  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .action-item:hover:not(.disabled) {
    background-color: ${colors.primary} !important;
    color: white;
  }

  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .action-menu-item {
    color: inherit;
  }

  .snack-monaco-editor
    .monaco-menu
    .monaco-action-bar.vertical
    .action-item:hover:not(.disabled)
    .action-label:focus {
    color: white;
  }

  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .keybinding {
    color: inherit;
    font-size: inherit;
    opacity: 0.3;
  }

  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .keybinding,
  .snack-monaco-editor .monaco-menu .monaco-action-bar.vertical .action-label:not(.separator) {
    padding: 8px 12px;
  }

  .snack-monaco-editor .monaco-action-bar.vertical .action-label.separator {
    border-bottom-color: currentColor;
    opacity: 0.1;
  }

  .snack-monaco-editor .context-view.monaco-menu-container {
    background-color: ${c('content')};
    color: ${c('text')};
    border-color: ${c('editor-border')};
  }

  .snack-monaco-editor.theme-light .context-view.monaco-menu-container {
    border-width: 0;
  }

  .snack-monaco-editor.theme-dark .context-view.monaco-menu-container {
    border-width: 1px;
  }

  /* Light theme overrides */
  .snack-monaco-editor.theme-light .JsxText {
    color: ${light.colors['editor.foreground']};
  }

  .snack-monaco-editor.theme-light .JsxSelfClosingElement,
  .snack-monaco-editor.theme-light .JsxOpeningElement,
  .snack-monaco-editor.theme-light .JsxClosingElement,
  .snack-monaco-editor.theme-light .tagName-of-JsxOpeningElement,
  .snack-monaco-editor.theme-light .tagName-of-JsxClosingElement,
  .snack-monaco-editor.theme-light .tagName-of-JsxSelfClosingElement {
    color: ${lightColors.syntax.property};
  }

  .snack-monaco-editor.theme-light .name-of-JsxAttribute {
    color: ${lightColors.syntax.number};
  }

  .snack-monaco-editor.theme-light .name-of-PropertyAssignment {
    color: ${lightColors.syntax.string};
  }

  .snack-monaco-editor.theme-light .name-of-PropertyAccessExpression {
    color: ${lightColors.syntax.constant};
  }

  /* Dark theme overrides */
  .snack-monaco-editor.theme-dark .JsxText {
    color: ${dark.colors['editor.foreground']};
  }

  .snack-monaco-editor.theme-dark .JsxSelfClosingElement,
  .snack-monaco-editor.theme-dark .JsxOpeningElement,
  .snack-monaco-editor.theme-dark .JsxClosingElement,
  .snack-monaco-editor.theme-dark .tagName-of-JsxOpeningElement,
  .snack-monaco-editor.theme-dark .tagName-of-JsxClosingElement,
  .snack-monaco-editor.theme-dark .tagName-of-JsxSelfClosingElement {
    color: ${darkColors.syntax.property};
  }

  .snack-monaco-editor.theme-dark .name-of-JsxAttribute {
    color: ${darkColors.syntax.number};
  }

  .snack-monaco-editor.theme-dark .name-of-PropertyAssignment {
    color: ${darkColors.syntax.string};
  }

  .snack-monaco-editor.theme-dark .name-of-PropertyAccessExpression {
    color: ${darkColors.syntax.constant};
  }

  .snack-monaco-vim-statusbar {
    font-family: ${'var(--font-monospace)'};
    font-size: 12px;
    padding: 0 16px;
    height: 24px;
    line-height: 24px;
    border-top: 1px solid ${colors.border};
  }

  .snack-monaco-vim-statusbar input {
    font-family: ${'var(--font-monospace)'};
    height: 100%;
    outline: 0;
    border: 0;
    background: transparent;
  }
`;
