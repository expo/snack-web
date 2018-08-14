/* @flow */
import * as babylon from 'babylon';
import { parse, types } from 'recast';
import validate from 'validate-npm-package-name';
import config from '../configs/babylon';

const parser = {
  parse: (code: string) => babylon.parse(code, config),
};

const getModuleNameFromRequire = (node: *) => {
  const { callee, arguments: args } = node;

  let name;

  if (callee.name === 'require' && args.length === 1) {
    if (args[0].type === 'Literal' || args[0].type === 'StringLiteral') {
      name = args[0].value;
    } else if (args[0].type === 'TemplateLiteral' && args[0].quasis.length === 1) {
      name = args[0].quasis[0].value.cooked;
    }
  }

  return name;
};

const isValidBundle = (name: any) => {
  if (typeof name !== 'string') {
    return false;
  }

  const match = /^(?:@([^/?]+)\/)?([^@/?]+)(?:\/([^@]+))?/.exec(name);
  const fullName = match ? (match[1] ? `@${match[1]}/` : '') + match[2] : null;

  return validate(fullName).validForOldPackages;
};

const findDependencies = (code: string): string[] => {
  const dependencies = [];
  const ast = parse(code, { parser });

  types.visit(ast, {
    visitImportDeclaration(path) {
      dependencies.push(path.node.source.value);

      this.traverse(path);
    },

    visitExportNamedDeclaration(path) {
      const name = path.node.source && path.node.source.value;

      if (name) {
        dependencies.push(name);
      }

      this.traverse(path);
    },

    visitExportAllDeclaration(path) {
      dependencies.push(path.node.source.value);

      this.traverse(path);
    },

    visitCallExpression(path) {
      const name = getModuleNameFromRequire(path.node);

      if (name) {
        dependencies.push(name);
      }

      this.traverse(path);
    },
  });

  return dependencies.filter(
    (name, index, array) => isValidBundle(name) && array.indexOf(name) === index
  );
};

export default findDependencies;
