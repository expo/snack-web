/* @flow */

import * as babylon from 'babylon';
import { parse, types } from 'recast';
import validate from 'validate-npm-package-name';
import pickBy from 'lodash/pickBy';
import config from '../configs/babylon';

const parser = {
  parse: (code: string) => babylon.parse(code, config),
};

const getVersionFromComments = (comments: Array<{ value: string }>) => {
  return comments &&
    comments[0] &&
    /^\s*((\d+\.)?(\d+\.)?(\*|\d+))|(LATEST)\s*$/.test(comments[0].value)
    ? comments[0].value.trim()
    : null;
};

const getModuleFromRequire = (path: *) => {
  const { callee, arguments: args } = path.node;

  let name;

  if (callee.name === 'require' && args.length === 1) {
    if (args[0].type === 'Literal' || args[0].type === 'StringLiteral') {
      name = args[0].value;
    } else if (args[0].type === 'TemplateLiteral' && args[0].quasis.length === 1) {
      name = args[0].quasis[0].value.cooked;
    }
  }

  const version = getVersionFromComments(
    (args[0] && args[0].trailingComments) || path.parentPath.parentPath.node.trailingComments
  );

  return [name, version];
};

const isValidBundle = (name: any) => {
  if (typeof name !== 'string') {
    return false;
  }

  const match = /^(?:@([^/?]+)\/)?([^@/?]+)(?:\/([^@]+))?/.exec(name);
  const fullName = match ? (match[1] ? `@${match[1]}/` : '') + match[2] : null;

  return validate(fullName).validForOldPackages;
};

const findDependencies = (code: string): { [key: string]: string } => {
  const dependencies = {};
  const ast = parse(code, { parser });

  types.visit(ast, {
    visitImportDeclaration(path) {
      dependencies[path.node.source.value] = getVersionFromComments(path.node.trailingComments);

      this.traverse(path);
    },

    visitExportNamedDeclaration(path) {
      const name = path.node.source && path.node.source.value;

      if (name) {
        dependencies[name] = getVersionFromComments(path.node.trailingComments);
      }

      this.traverse(path);
    },

    visitExportAllDeclaration(path) {
      dependencies[path.node.source.value] = getVersionFromComments(path.node.trailingComments);

      this.traverse(path);
    },

    visitCallExpression(path) {
      const [name, version] = getModuleFromRequire(path);

      if (name) {
        dependencies[name] = version;
      }

      this.traverse(path);
    },
  });

  return pickBy(dependencies, (value, key) => isValidBundle(key));
};

export default findDependencies;
