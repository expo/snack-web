/* @flow */

const css: any = String.raw;

export default css`
  .prism-code {
    background-color: #fafafa;
    color: #6e7580;
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
    color: #55b4d4;
  }

  .prism-code .token.function {
    color: #f29718;
  }

  .prism-code .token.entity {
    color: #399ee6;
  }

  .prism-code .token.string,
  .prism-code .token.selector,
  .prism-code .token.attr-name,
  .prism-code .token.char,
  .prism-code .token.builtin,
  .prism-code .token.inserted {
    color: #86b300;
  }

  .prism-code .token.regexp,
  .prism-code .token.important,
  .prism-code .token.variable {
    color: #4cbf99;
  }

  .prism-code .token.markup {
    color: #f07171;
  }

  .prism-code .token.keyword,
  .prism-code .token.atrule,
  .prism-code .token.attr-value,
  .prism-code .token.tag > .token.punctuation {
    color: #fa6e32;
  }

  .prism-code .token.special {
    color: #e6b673;
  }

  .prism-code .token.comment,
  .prism-code .token.prolog,
  .prism-code .token.doctype,
  .prism-code .token.cdata {
    color: #abb0b6;
  }

  .prism-code .token.constant,
  .prism-code .token.boolean,
  .prism-code .token.number,
  .prism-code .token.constant,
  .prism-code .token.symbol,
  .prism-code .token.deleted {
    color: #a37acc;
  }

  .prism-code .token.operator,
  .prism-code .token.entity,
  .prism-code .token.url,
  .prism-code .language-css .token.string,
  .prism-code .style .token.string {
    color: #ed9366;
  }

  .prism-code .token.punctuation {
    color: #85888c;
  }
`;
