/* @flow */

export default (async function lintCode(code: string) {
  const {
    default: Linter,
  } = await import(/* webpackChunkName: "eslint_bundle" */ '../vendor/eslint.bundle');
  const { default: config } = await import('../configs/eslint.json');

  // babel-eslint throws error without this
  window.config = config;

  const linter = new Linter();
  const errors = linter.verify(code, config);

  return errors.map(err => ({
    startLineNumber: err.line,
    endLineNumber: err.line,
    startColumn: err.column,
    endColumn: err.column,
    message: `${err.message} (${err.ruleId})`,
    severity: err.message.toLowerCase().startsWith('parsing error') ? 4 : err.severity + 1,
    source: 'ESLint',
  }));
});
