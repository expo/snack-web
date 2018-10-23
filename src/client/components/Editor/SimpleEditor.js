/* @flow */

import React from 'react';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import Helmet from 'react-helmet';
import Editor from 'react-simple-code-editor';
import escape from 'escape-html';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import { light, dark } from './themes/simple-editor';
import constants from '../../configs/constants';

type Props = {|
  path: string,
  value: string,
  onValueChange: (value: string) => mixed,
  lineNumbers: 'on' | 'off',
  theme: ThemeName,
|};

// Store selection and undo stack
const sessions = new Map();

class SimpleEditor extends React.Component<Props> {
  static defaultProps = {
    lineNumbers: 'on',
  };

  static removePath(path: string) {
    sessions.delete(path);
  }

  static renamePath(oldPath: string, newPath: string) {
    const session = sessions.get(oldPath);

    sessions.delete(oldPath);
    sessions.set(newPath, session);
  }

  componentDidUpdate(prevProps) {
    const editor = this._editor;

    if (this.props.path !== prevProps.path && editor) {
      // Save the editor state for the previous file so we can restore it when it's re-opened
      sessions.set(prevProps.path, editor.session);

      // If we find a previous session for the current file, restore it
      // Otherwise set the session session to a fresh one
      const session = sessions.get(this.props.path);

      if (session) {
        editor.session = session;
      } else {
        editor.session = {
          history: {
            stack: [],
            offset: -1,
          },
        };
      }
    }
  }

  _highlight = code => {
    if (this.props.path.endsWith('.js')) {
      return highlight(code, languages.jsx);
    } else if (this.props.path.endsWith('.json')) {
      return highlight(code, languages.json);
    } else if (this.props.path.endsWith('.md')) {
      return highlight(code, languages.markdown);
    }

    return escape(code);
  };

  _editor: ?Editor;

  render() {
    const { value, lineNumbers, theme, onValueChange } = this.props;

    return (
      <div
        className={css(styles.container, lineNumbers === 'on' && styles.containerWithLineNumbers)}>
        <Editor
          ref={c => (this._editor = c)}
          value={value}
          onValueChange={onValueChange}
          highlight={code =>
            lineNumbers === 'on'
              ? this._highlight(code)
                  .split('\n')
                  .map(line => `<span class="${css(styles.line)}">${line}</span>`)
                  .join('\n')
              : this._highlight(code)}
          padding={lineNumbers === 'on' ? 0 : 8}
          className={classnames(css(styles.editor), 'prism-code')}
        />
        <Helmet style={[{ cssText: theme === 'dark' ? dark : light }]} />
      </div>
    );
  }
}

export default withThemeName(SimpleEditor);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'auto',
  },
  containerWithLineNumbers: {
    paddingLeft: 64,
  },
  editor: {
    fontFamily: 'var(--font-monospace)',
    fontSize: 12,
    minHeight: '100%',
    counterReset: 'line',
  },
  line: {
    ':before': {
      position: 'absolute',
      right: '100%',
      marginRight: 26,
      textAlign: 'right',
      opacity: 0.5,
      userSelect: 'none',
      counterIncrement: 'line',
      content: 'counter(line)',
    },
  },
});
