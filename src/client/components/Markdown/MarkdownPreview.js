/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import Helmet from 'react-helmet';
import marked from 'marked';
import escape from 'escape-html';
import sanitize from 'sanitize-html';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-diff';
import './markdown.css';

import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import { light, dark } from '../Editor/themes/simple-editor';
import { c } from '../ColorsProvider';

type Props = {|
  source: string,
  theme: ThemeName,
|};

// use a custom renderer to customize the `a` tag and add `target='_blank'`
const renderer = new marked.Renderer();

renderer.link = function(...args) {
  return marked.Renderer.prototype.link.apply(this, args).replace(/^<a/, '<a target="_blank"');
};

class MarkdownPreview extends React.Component<Props> {
  render() {
    const { source, theme } = this.props;

    let html = marked(source, {
      renderer,
      gfm: true,
      silent: true,
      highlight: (code, lang) => {
        const grammar = lang === 'js' ? languages.jsx : languages[lang];
        return grammar ? highlight(code, grammar) : escape(code);
      },
    });

    html = sanitize(html, require('./santize-config.json'));

    return (
      <React.Fragment>
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
          className={classnames(
            css(styles.content),
            theme === 'dark' ? 'theme-dark' : 'theme-light',
            'markdown-body',
            'prism-code'
          )}
        />
        <Helmet style={[{ cssText: theme === 'dark' ? dark : light }]} />
      </React.Fragment>
    );
  }
}

export default withThemeName(MarkdownPreview);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: c('content'),
    color: c('text'),
    padding: 40,
  },
});
