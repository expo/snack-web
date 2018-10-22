/* @flow */

import * as lightColors from './colors-light';
import * as darkColors from './colors-dark';

const css: any = String.raw;

const theme = ({ syntax, ui }) => css`
  .prism-code {
    background-color: ${ui.background};
    color: ${ui.text};
  }

  .prism-code ::selection {
    background: rgba(0, 0, 0, 0.16);
  }

  .prism-code ::-moz-selection {
    background: rgba(0, 0, 0, 0.16);
  }

  .prism-code textarea {
    outline: 0;
  }

  .prism-code .token.tag,
  .prism-code .token.property {
    color: ${syntax.property};
  }

  .prism-code .token.function {
    color: ${syntax.constant};
  }

  .prism-code .token.entity {
    color: ${syntax.property};
  }

  .prism-code .token.string,
  .prism-code .token.selector,
  .prism-code .token.char,
  .prism-code .token.builtin,
  .prism-code .token.inserted {
    color: ${syntax.string};
  }

  .prism-code .token.regexp,
  .prism-code .token.variable {
    color: ${syntax.regexp};
  }

  .prism-code .token.keyword,
  .prism-code .token.atrule,
  .prism-code .token.tag > .token.punctuation,
  .prism-code .token.important {
    color: ${syntax.keyword};
  }

  .prism-code .token.attr-name {
    color: ${syntax.number};
  }

  .prism-code .token.attr-value {
    color: ${syntax.string};
  }

  .prism-code .token.markup,
  .prism-code .token.special {
    color: ${syntax.predefined};
  }

  .prism-code .token.comment,
  .prism-code .token.prolog,
  .prism-code .token.doctype,
  .prism-code .token.cdata {
    color: ${syntax.comment};
  }

  .prism-code .token.number {
    color: ${syntax.number};
  }

  .prism-code .token.constant,
  .prism-code .token.boolean,
  .prism-code .token.constant,
  .prism-code .token.symbol,
  .prism-code .token.deleted {
    color: ${syntax.constant};
  }

  .prism-code .token.operator,
  .prism-code .token.entity,
  .prism-code .token.url,
  .prism-code .language-css .token.string,
  .prism-code .style .token.string {
    color: ${syntax.operator};
  }

  .prism-code .token.punctuation {
    color: ${syntax.comment};
  }
`;

export const light = theme(lightColors);
export const dark = theme(darkColors);
