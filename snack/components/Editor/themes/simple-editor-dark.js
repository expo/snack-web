/* @flow */

const css: any = String.raw;

export default css`
  .prism-code {
    background-color: #212733;
    color: #d9d7ce;
  }

  .prism-code ::selection {
    background: rgba(255, 255, 255, 0.24);
  }

  .prism-code ::-moz-selection {
    background: rgba(255, 255, 255, 0.24);
  }

  .prism-code textarea {
    outline: 0;
  }

  .prism-code .token.tag,
  .prism-code .token.property {
    color: #5ccfe6;
  }

  .prism-code .token.function {
    color: #ffd580;
  }

  .prism-code .token.entity {
    color: #73d0ff;
  }

  .prism-code .token.string,
  .prism-code .token.selector,
  .prism-code .token.attr-name,
  .prism-code .token.char,
  .prism-code .token.builtin,
  .prism-code .token.inserted {
    color: #bae67e;
  }

  .prism-code .token.regexp,
  .prism-code .token.important,
  .prism-code .token.variable {
    color: #95e6cb;
  }

  .prism-code .token.markup {
    color: #f28779;
  }

  .prism-code .token.keyword,
  .prism-code .token.atrule,
  .prism-code .token.attr-value,
  .prism-code .token.tag > .token.punctuation {
    color: #ffa759;
  }

  .prism-code .token.special {
    color: #ffc44c;
  }

  .prism-code .token.comment,
  .prism-code .token.prolog,
  .prism-code .token.doctype,
  .prism-code .token.cdata {
    color: #5c6773;
  }

  .prism-code .token.constant,
  .prism-code .token.boolean,
  .prism-code .token.number,
  .prism-code .token.constant,
  .prism-code .token.symbol,
  .prism-code .token.deleted {
    color: #d4bfff;
  }

  .prism-code .token.operator,
  .prism-code .token.entity,
  .prism-code .token.url,
  .prism-code .language-css .token.string,
  .prism-code .style .token.string {
    color: #f29e74;
  }

  .prism-code .token.punctuation {
    color: #738699;
  }
`;
