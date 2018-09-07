/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import Helmet from 'react-helmet';
import debounce from 'lodash/debounce';

import AceSessionManager from '../../utils/AceSessionManager';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import type { Annotation } from '../../utils/convertErrorToAnnotation';

import constants from '../../configs/constants';

type Props = {|
  path: string,
  value: string,
  onValueChange: (value: string) => mixed,
  annotations: Array<Annotation>,
  lineNumbers?: 'on' | 'off',
  editorMode?: 'vim' | 'normal',
  theme: ThemeName,
|};

type State = {|
  height: string | number,
  width: string | number,
|};

const cssText = `
  /* Editor styles */
  .ace_gutter-cell.ace_error {
    background-image: url(${require('../../assets/cross-red.png')}) !important;
    background-size: 16px !important;
  }

  .ace_search {
    right: 0 !important;
    bottom: 0 !important;
    left: auto !important;
    top: auto !important;
    margin: 0 1em !important;
    border-radius: 5px 5px 0 0 !important;
    border-bottom: 0 !important;
    padding: 1em !important;
    padding-bottom: 1em !important;
    max-width: 339px !important;
  }

  .ace_search_field {
    height: 28px !important;
    width: 212px !important;
    color: inherit;
  }

  .ace_searchbtn {
    height: 28px !important;
    width: 33px !important;
  }

  .ace_replacebtn {
    height: 28px !important;
  }

  .ace_searchbtn_close {
    display: none !important;
  }
`;

class AceEditor extends React.PureComponent<Props, State> {
  static defaultProps = {
    lineNumbers: 'on',
  };

  static removePath(path: string) {
    AceSessionManager.remove(path);
  }

  static renamePath(oldPath: string, newPath: string) {
    AceSessionManager.rename(oldPath, newPath);
  }

  state = {
    height: '100%',
    width: '640px',
  };

  componentDidMount() {
    this._phantom.contentWindow.addEventListener('resize', this._handleResize);
    this._restoreSession(this.props.path, this.props.value);

    global.requestAnimationFrame(this._handleResize);
  }

  componentWillUpdate(nextProps: Props) {
    if (this.props.path !== nextProps.path) {
      this._saveSession(this.props.path);
      this._restoreSession(nextProps.path, nextProps.value);
    }
  }

  componentWillUnmount() {
    this._saveSession(this.props.path);
    this._phantom && this._phantom.contentWindow.removeEventListener('resize', this._handleResize);
  }

  _getMode = path => (path.endsWith('.json') ? 'json' : 'jsx');

  _saveSession = (path: string) => {
    AceSessionManager.save(path, this._editor.getSession());
  };

  _restoreSession = (path: string, content: string) => {
    const session = AceSessionManager.create(path, content, `ace/mode/${this._getMode(path)}`);
    const editor = this._editor;

    // Enable text wrapping
    session.setUseWrapMode(true);
    // Use 2 spaces for indentation
    session.setOptions({
      tabSize: 2,
      useSoftTabs: true,
    });

    editor.setSession(session);

    // Don't override Ctrl+L/Cmd+L
    editor.commands.removeCommands(['gotoline']);
  };

  _editor: any;
  _phantom: any;

  _adjustSoftWrap = (editor: any) => {
    const characterWidth = editor.renderer.characterWidth;
    const contentWidth = editor.renderer.scroller.clientWidth;
    const session = editor.getSession();

    if (contentWidth > 0 && session.getUseWrapMode()) {
      session.setWrapLimit(parseInt((contentWidth - 24) / characterWidth, 10));
    }
  };

  _handleResize = debounce(
    () => {
      if (this._phantom) {
        const size = this._phantom.getBoundingClientRect();
        this.setState(
          {
            height: size.height,
            width: size.width,
          },
          () => {
            if (this._editor) {
              this._editor.resize();
              this._adjustSoftWrap(this._editor);
            }
          }
        );
      }
    },
    100,
    { leading: true, trailing: true }
  );

  _handleLoad = (editor: any) => {
    this._editor = editor;
  };

  render() {
    require('brace');
    const AceEditor = require('react-ace').default;
    require('brace/mode/jsx');
    require('brace/mode/json');
    require('brace/ext/language_tools');
    require('brace/ext/searchbox');
    require('brace/keybinding/vim');
    require('./themes/ace');

    const { onValueChange, path, value, annotations, lineNumbers, theme } = this.props;

    return (
      <div className={css(styles.container)}>
        <iframe ref={c => (this._phantom = c)} type="text/html" className={css(styles.phantom)} />
        <AceEditor
          enableBasicAutocompletion
          enableLiveAutocompletion
          focus
          mode={this._getMode(path)}
          tabSize={2}
          theme={theme === 'light' ? 'snack-light' : 'snack-dark'}
          onChange={onValueChange}
          name="code"
          value={value}
          annotations={annotations.map(annotation => ({
            row: Math.max(annotation.startLineNumber - 1, 0),
            column: annotation.endLineNumber,
            text: annotation.message,
            source: annotation.source,
            type: annotation.severity >= 3 ? 'error' : 'warning',
          }))}
          editorProps={{ $blockScrolling: Infinity }}
          showGutter={lineNumbers === 'on'}
          showPrintMargin={false}
          scrollMargin={[16, 0, 0, 0]}
          style={{
            width: this.state.width,
            height: this.state.height,
            lineHeight: 1.5,
          }}
          className={css(styles.editor, styles.fill)}
          onLoad={this._handleLoad}
          keyboardHandler={this.props.editorMode === 'normal' ? null : this.props.editorMode}
        />
        <Helmet style={[{ cssText }]} />
      </div>
    );
  }
}

export default withThemeName(AceEditor);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  resizable: {
    opacity: 0,
  },
  editor: {
    backgroundColor: 'transparent',
    fontFamily: constants.fonts.monospace,
  },
  phantom: {
    display: 'block',
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
    pointerEvents: 'none',
    opacity: 0,
  },
});
