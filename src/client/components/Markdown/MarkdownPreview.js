/* @flow */

import * as React from 'react';
import MarkdownIt from 'markdown-it';
import sanitizer from 'markdown-it-sanitizer';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import Helmet from 'react-helmet';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-jsx';
import './markdown.css';

import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import { light, dark } from '../Editor/themes/simple-editor';
import { c } from '../ColorsProvider';

type Props = {|
  source: string,
  theme: ThemeName,
|};

class MarkdownPreview extends React.Component<Props> {
  render() {
    const md = new MarkdownIt({
      linkify: true,
      html: true,
      highlight: (code, lang) => {
        const language = lang === 'js' ? languages.jsx : languages[lang];
        return language ? highlight(code, language) : null;
      },
    }).use(sanitizer);

    return (
      <React.Fragment>
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: md.render(this.props.source),
          }}
          className={classnames(css(styles.content), 'markdown-body', 'prism-code')}
        />
        <Helmet style={[{ cssText: this.props.theme === 'dark' ? dark : light }]} />
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
