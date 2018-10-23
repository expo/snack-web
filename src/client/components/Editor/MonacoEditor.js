/* @flow */

import * as React from 'react';
import Helmet from 'react-helmet';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import debounce from 'lodash/debounce';
import mapValues from 'lodash/mapValues';
import { preloadedModules } from 'snack-sdk';
import { initVimMode } from 'monaco-vim';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.main';
import { SimpleEditorModelResolverService } from 'monaco-editor/esm/vs/editor/standalone/browser/simpleServices';
import { StaticServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices';
import { light, dark } from './themes/monaco';
import overrides from './themes/monaco-overrides';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import ResizeDetector from '../shared/ResizeDetector';
import prettierCode from '../../utils/prettierCode';
import getRelativePath from '../../utils/getRelativePath';
import constants from '../../configs/constants';
import type { SDKVersion } from '../../configs/sdk';
import type { FileSystemEntry } from '../../types';
import type { Annotation } from '../../utils/convertErrorToAnnotation';

/**
 * Monkeypatch to make 'Find All References' work across multiple files
 * https://github.com/Microsoft/monaco-editor/issues/779#issuecomment-374258435
 */
SimpleEditorModelResolverService.prototype.findModel = function(editor, resource) {
  return monaco.editor.getModels().find(model => model.uri.toString() === resource.toString());
};

global.MonacoEnvironment = {
  getWorker(moduleId, label) {
    switch (label) {
      case 'json':
        /* $FlowFixMe */
        return new Worker('monaco-editor/esm/vs/language/json/json.worker', {
          type: 'module',
        });
      case 'typescript':
      case 'javascript':
        /* $FlowFixMe */
        return new Worker('monaco-editor/esm/vs/language/typescript/ts.worker', {
          type: 'module',
        });
      default:
        /* $FlowFixMe */
        return new Worker('monaco-editor/esm/vs/editor/editor.worker', { type: 'module' });
    }
  },
};

monaco.editor.defineTheme('light', light);
monaco.editor.defineTheme('dark', dark);

/**
 * Disable typescript's diagnostics for JavaScript files.
 * This suppresses errors when using Flow syntax.
 * It's also unnecessary since we use ESLint for error checking.
 */
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true,
});

/**
 * Use prettier to format JavaScript code.
 * This will replace the default formatter.
 */
monaco.languages.registerDocumentFormattingEditProvider('javascript', {
  async provideDocumentFormattingEdits(model, options, token) {
    const text = await prettierCode(model.getValue());

    return [
      {
        range: model.getFullModelRange(),
        text,
      },
    ];
  },
});

/**
 * Sync all the models to the worker eagerly.
 * This enables intelliSense for all files without needing an `addExtraLib` call.
 */
monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

/**
 * Configure the typescript compiler to detect JSX and load type definitions
 */
const compilerOptions = {
  allowJs: true,
  allowSyntheticDefaultImports: true,
  alwaysStrict: true,
  jsx: 'React',
  jsxFactory: 'React.createElement',
};

monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);

type Language = 'javascript' | 'typescript' | 'json' | 'css' | 'html';

type Props = {
  entries: FileSystemEntry[],
  dependencies: { [name: string]: { version: string } },
  sdkVersion: SDKVersion,
  path: string,
  value: string,
  mode: 'normal' | 'vim',
  onOpenPath: (path: string) => mixed,
  onValueChange: (value: string) => mixed,
  annotations: Array<Annotation>,
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval',
  wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded',
  scrollBeyondLastLine?: boolean,
  minimap?: {
    enabled?: boolean,
    maxColumn?: number,
    renderCharacters?: boolean,
    showSlider?: 'always' | 'mouseover',
    side?: 'right' | 'left',
  },
  autoFocus?: boolean,
  fontFamily?: string,
  fontLigatures?: boolean,
  theme: ThemeName,
};

// Store editor states such as cursor position, selection and scroll position for each model
const editorStates = new Map();

// Store details about typings we have requested and loaded
const requestedTypings = new Map();
const extraLibs = new Map();

const codeEditorService = StaticServices.codeEditorService.get();

class MonacoEditor extends React.Component<Props> {
  static defaultProps = {
    lineNumbers: 'on',
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false,
    },
    fontFamily: 'var(--font-monospace)',
    fontLigatures: true,
  };

  static removePath(path: string) {
    // Remove editor states
    editorStates.delete(path);

    // Remove associated models
    const model = monaco.editor.getModels().find(model => model.uri.path === path);

    model && model.dispose();
  }

  static renamePath(oldPath: string, newPath: string) {
    const selection = editorStates.get(oldPath);

    editorStates.delete(oldPath);
    editorStates.set(newPath, selection);

    this.removePath(oldPath);
  }

  componentDidMount() {
    // Spawn a worker to fetch type definitions for dependencies
    /* $FlowFixMe */
    this._typingsWorker = new Worker('../../workers/typings.worker', { type: 'module' });
    this._typingsWorker.addEventListener('message', ({ data }: any) => this._addTypings(data));

    const { path, value, annotations, autoFocus, ...rest } = this.props;

    // The methods provided by the service are on it's prototype
    // So spreading this object doesn't work, we must mutate it
    codeEditorService.openCodeEditor = async ({ resource, options }, editor) => {
      await this.props.onOpenPath(resource.path);

      editor.setSelection(options.selection);
      editor.revealLine(options.selection.startLineNumber);

      return {
        getControl: () => editor,
      };
    };

    this._editor = monaco.editor.create(this._node, rest, codeEditorService);

    this._subscription = this._editor.onDidChangeModelContent(() => {
      const value = this._editor.getModel().getValue();

      if (value !== this.props.value) {
        this.props.onValueChange(value);
      }
    });

    this._toggleMode(this.props.mode);

    this._openFile(path, value, autoFocus);
    this._updateMarkers(annotations);
    this._fetchTypings(this.props.dependencies, this.props.sdkVersion);

    // Load all the files so the editor can provide proper intellisense
    this.props.entries.forEach(({ item }) => {
      if (item.type === 'file' && item.path !== path && typeof item.content === 'string') {
        this._initializeFile(item.path, item.content);
      }
    });

    // Add custom hover provider to show version for imported modules
    this._hoverProvider = monaco.languages.registerHoverProvider('javascript', {
      provideHover: (model, position) => {
        // Get the current line
        const line = model.getLineContent(position.lineNumber);

        // Tokenize the line
        const tokens = monaco.editor.tokenize(line, this._getLanguage(this.props.path))[0];

        for (let i = 0, l = tokens.length; i < l; i++) {
          const current = tokens[i];
          const next = tokens[i + 1];
          const end = next ? next.offset : line.length;
          if (
            current.type === 'string.js' &&
            position.column > current.offset &&
            position.column < end
          ) {
            // Get the string for the token and strip quotes
            const string = line.slice(current.offset + 1, end - 1);

            const deps = this._getAllDependencies(this.props.dependencies, this.props.sdkVersion);

            if (deps[string]) {
              // If the string refers to a dependency show the version
              return {
                range: new monaco.Range(
                  position.lineNumber,
                  current.offset + 1,
                  position.lineNumber,
                  end
                ),
                contents: [{ value: `version "${deps[string].version}"` }],
              };
            }
          }
        }
      },
    });

    // Add custom completion provider to provide autocomplete for files and dependencies
    this._completionProvider = monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ["'", '"', '.', '/'],
      provideCompletionItems: (model, position) => {
        // Get editor content before the pointer
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        if (/(([\s|\n]+from\s+)|(\brequire\b\s*\())["|'][^'^"]*$/.test(textUntilPosition)) {
          // It's probably a `import` statement or `require` call
          if (textUntilPosition.endsWith('.') || textUntilPosition.endsWith('/')) {
            // User is trying to import a file

            // Get the text after the quotes
            const typed = textUntilPosition.match(/[^'"]+$/)[0];
            // Map '.' to './' and '..' to '../' for better autocomplete
            const prefix = typed === '.' ? './' : typed === '..' ? '../' : typed;

            return this.props.entries
              .filter(
                // $FlowIgnore  only TextFileEntries have the virtual property
                ({ item }) => item.path !== this.props.path && !item.virtual
              )
              .map(({ item }) => {
                let file = getRelativePath(this.props.path, item.path);

                if (
                  // Only show files that match the prefix typed by user
                  file.startsWith(prefix) &&
                  // Only show files in the same directory as the prefix
                  file.split('/').length <= prefix.split('/').length
                ) {
                  // Remove typed text from the path so that don't insert it twice
                  file = file.slice(typed.length);

                  return {
                    // Show only the file name for label
                    label: file.split('/').pop(),
                    // Don't keep extension for JS files
                    insertText: item.type === 'file' ? file.replace(/\.js$/, '') : file,
                    kind:
                      item.type === 'folder'
                        ? monaco.languages.CompletionItemKind.Folder
                        : monaco.languages.CompletionItemKind.File,
                  };
                }

                return null;
              })
              .filter(Boolean);
          } else {
            const deps = this._getAllDependencies(this.props.dependencies, this.props.sdkVersion);

            // User is trying to import a dependency
            return Object.keys(deps).map(name => ({
              label: name,
              detail: deps[name].version,
              kind: monaco.languages.CompletionItemKind.Module,
            }));
          }
        }
      },
    });
  }

  componentDidUpdate(prevProps: Props) {
    const {
      path,
      value,
      mode,
      annotations,
      dependencies,
      sdkVersion,
      autoFocus,
      theme,
      ...rest
    } = this.props;

    this._editor.updateOptions(rest);

    if (path !== prevProps.path) {
      // Save the editor state for the previous file so we can restore it when it's re-opened
      editorStates.set(prevProps.path, this._editor.saveViewState());

      this._openFile(path, value, autoFocus);
    } else if (value !== this._editor.getModel().getValue()) {
      this._editor.executeEdits(null, [
        {
          range: this._editor.getModel().getFullModelRange(),
          text: value,
        },
      ]);
    }

    if (annotations !== prevProps.annotations) {
      this._updateMarkers(annotations);
    }

    if (dependencies !== prevProps.dependencies || sdkVersion !== prevProps.sdkVersion) {
      this._fetchTypings(dependencies, sdkVersion);
    }

    if (mode !== prevProps.mode) {
      this._toggleMode(mode);
    }

    if (theme !== prevProps.theme) {
      // Update the global editor theme
      // Monaco doesn't have a way to change theme locally
      monaco.editor.setTheme(theme);
    }

    if (this.props.entries !== prevProps.entries) {
      // Update all changed entries for updated intellisense
      this.props.entries.forEach(({ item }) => {
        if (item.type === 'file' && !item.asset && item.path !== path) {
          const previous = prevProps.entries.find(e => e.item.path === item.path);

          if (previous && previous.item.content === item.content) {
            return;
          }

          this._initializeFile(item.path, item.content);
        }
      });
    }
  }

  componentWillUnmount() {
    this._subscription && this._subscription.dispose();
    this._editor && this._editor.dispose();
    this._hoverProvider && this._hoverProvider.dispose();
    this._completionProvider && this._completionProvider.dispose();
    this._typingsWorker && this._typingsWorker.terminate();
  }

  _getLanguage = (path: string): ?Language => {
    if (path.includes('.')) {
      switch (path.split('.').pop()) {
        case 'js':
          return 'javascript';
        case 'ts':
          return 'typescript';
        case 'json':
          return 'json';
        case 'css':
          return 'css';
        case 'html':
          return 'html';
        case 'md':
          return 'markdown';
        default:
          return undefined;
      }
    }
  };

  _initializeFile = (path: string, value: string) => {
    let model = monaco.editor.getModels().find(model => model.uri.path === path);

    if (model && !model.isDisposed()) {
      // If a model exists, we need to update it's value
      // This is needed because the content for the file might have been modified externally
      // Use `pushEditOperations` instead of `setValue` or `applyEdits` to preserve undo stack
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ]
      );
    } else {
      const language = this._getLanguage(path);

      model = monaco.editor.createModel(value, language, new monaco.Uri().with({ path }));
      model.updateOptions({
        tabSize: 2,
        insertSpaces: true,
      });
    }
  };

  _openFile = (path: string, value: string, focus?: boolean) => {
    this._initializeFile(path, value);

    const model = monaco.editor.getModels().find(model => model.uri.path === path);

    this._editor.setModel(model);

    // Restore the editor state for the file
    const editorState = editorStates.get(path);

    if (editorState) {
      this._editor.restoreViewState(editorState);
    }

    if (focus) {
      this._editor.focus();
    }
  };

  _getAllDependencies = (dependencies, sdkVersion) => ({
    ...mapValues(preloadedModules.dependencies[sdkVersion], version => ({ version })),
    ...dependencies,
  });

  _fetchTypings = (dependencies, sdkVersion) => {
    const deps = this._getAllDependencies(dependencies, sdkVersion);

    Object.keys(deps).forEach(qualifier => {
      const { version } = deps[qualifier];

      // Parse the qualifier to get the package name
      // This will handle qualifiers with deep imports
      const match = /^(?:@([^/?]+)\/)?([^@/?]+)(?:\/([^@]+))?/.exec(qualifier);

      if (!match) {
        return;
      }

      const name = (match[1] ? `@${match[1]}/` : '') + match[2];

      if (requestedTypings.get(name) === version) {
        // Typing already loaded
        return;
      }

      requestedTypings.set(name, version);

      this._typingsWorker.postMessage({
        name,
        version,
      });
    });
  };

  _addTypings = ({ name, version, typings }) => {
    Object.keys(typings).forEach(path => {
      let extraLib = extraLibs.get(path);

      extraLib && extraLib.dispose();
      extraLib = monaco.languages.typescript.javascriptDefaults.addExtraLib(typings[path], path);

      extraLibs.set(path, extraLib);
    });
  };

  _updateMarkers = (annotations: Annotation[]) =>
    monaco.editor.setModelMarkers(this._editor.getModel(), null, annotations);

  _toggleMode = mode => {
    if (mode === 'vim') {
      this._vim = initVimMode(this._editor, this._statusbar);
    } else {
      this._vim && this._vim.dispose();
    }
  };

  _handleResize = debounce(() => this._editor.layout(), 50, {
    leading: true,
    trailing: true,
  });

  _typingsWorker: Worker;
  _hoverProvider: any;
  _completionProvider: any;
  _subscription: any;
  _editor: any;
  _vim: any;
  _node: any;
  _statusbar: any;

  render() {
    return (
      <div className={css(styles.container)}>
        <Helmet style={[{ cssText: overrides }]} />
        <ResizeDetector onResize={this._handleResize}>
          <div
            ref={c => (this._node = c)}
            className={classnames(
              css(styles.editor),
              'snack-monaco-editor',
              `theme-${this.props.theme}`
            )}
          />
        </ResizeDetector>
        {this.props.mode === 'vim' ? (
          <div className="snack-monaco-vim-statusbar" ref={c => (this._statusbar = c)} />
        ) : null}
      </div>
    );
  }
}

export default withThemeName(MonacoEditor);

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  },
  editor: {
    height: '100%',
    width: '100%',
  },
});
