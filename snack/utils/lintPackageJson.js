/* @flow */

import flatMap from 'lodash/flatMap';
import semver from 'semver';
import { isModulePreloaded } from 'snack-sdk';
import type { SDKVersion } from '../configs/sdk';

export default async function lintPackageJson(code: string, sdkVersion: SDKVersion) {
  /* $FlowFixMe */
  const { default: parse } = await import('json-to-ast');
  const source = 'package.json';

  let ast;

  try {
    ast = parse(code, { source });
  } catch (e) {
    return [
      {
        startLineNumber: e.line || 0,
        endLineNumber: e.line || 0,
        startColumn: e.column || 0,
        endColumn: e.column || 0,
        message: e.message,
        severity: 3,
        source,
      },
    ];
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
        startLineNumber: item.key.loc.start.line,
        endLineNumber: item.key.loc.end.line,
        startColumn: item.key.loc.start.column,
        endColumn: item.key.loc.end.column,
        message: `Key "${item.key.value}" is not supported`,
        severity: 3,
        source,
      };
    }

    if (item.value.type !== 'Object') {
      return {
        startLineNumber: item.value.loc.start.line,
        endLineNumber: item.value.loc.end.line,
        startColumn: item.value.loc.start.column,
        endColumn: item.value.loc.end.column,
        message: `Value for "${item.key.value}" must be an object`,
        severity: 3,
        source,
      };
    }

    return item.value.children
      .map(it => {
        if (isModulePreloaded(it.key.value, sdkVersion)) {
          return {
            startLineNumber: it.key.loc.start.line,
            endLineNumber: it.key.loc.end.line,
            startColumn: it.key.loc.start.column,
            endColumn: it.key.loc.end.column,
            message: `The package "${it.key
              .value}" can be imported without adding to "dependencies"`,
            severity: 3,
            source,
          };
        }

        if (
          it.value.type !== 'Literal' ||
          !(semver.validRange(it.value.value) || it.value.value === 'latest')
        ) {
          return {
            startLineNumber: it.value.loc.start.line,
            endLineNumber: it.value.loc.end.line,
            startColumn: it.value.loc.start.column,
            endColumn: it.value.loc.end.column,
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
