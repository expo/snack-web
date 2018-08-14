/* @flow */

import flatMap from 'lodash/flatMap';
import semver from 'semver';

export default async function lintPackageJson(code: string) {
  /* $FlowFixMe */
  const parse = await import('json-to-ast');
  const source = 'package.json';

  let ast;

  try {
    ast = parse(code, { source });
  } catch (e) {
    return [];
  }

  if (ast.type !== 'Object') {
    return [
      {
        startLineNumber: ast.loc.start.line,
        endLineNumber: ast.loc.end.line,
        startColumn: ast.loc.start.column,
        endColumn: ast.loc.end.column,
        message: `Content of "${source}" file must be an Object`,
        severity: 3,
        source,
      },
    ];
  }

  return flatMap(ast.children, item => {
    if (item.key.value !== 'dependencies') {
      return {
        startLineNumber: ast.loc.start.line,
        endLineNumber: ast.loc.end.line,
        startColumn: ast.loc.start.column,
        endColumn: ast.loc.end.column,
        message: `Key "${item.key.value}" is not supported`,
        severity: 3,
        source,
      };
    }

    if (item.value.type !== 'Object') {
      return {
        startLineNumber: ast.loc.start.line,
        endLineNumber: ast.loc.end.line,
        startColumn: ast.loc.start.column,
        endColumn: ast.loc.end.column,
        message: `Value for "${item.key.value}" must be an object`,
        severity: 3,
        source,
      };
    }

    return item.value.children
      .map(it => {
        if (
          it.value.type !== 'Literal' ||
          !(semver.validRange(it.value.value) || it.value.value === 'latest')
        ) {
          return {
            startLineNumber: ast.loc.start.line,
            endLineNumber: ast.loc.end.line,
            startColumn: ast.loc.start.column,
            endColumn: ast.loc.end.column,
            message: `Version for "${it.key.value}" must be a valid semver version`,
            severity: 3,
            source,
          };
        }

        return null;
      })
      .filter(Boolean);
  });
}
