import * as babylon from '@babel/parser';
import { print, parse, types } from 'recast';
import validate from 'validate-npm-package-name';
import pickBy from 'lodash/pickBy';
import getFileLanguage from './getFileLanguage';

const parserPlugins = [
  'asyncGenerators',
  'bigInt',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  ['decorators', { decoratorsBeforeExport: true }],
  'doExpressions',
  'dynamicImport',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'functionBind',
  'functionSent',
  'importMeta',
  'logicalAssignment',
  'nullishCoalescingOperator',
  'numericSeparator',
  'objectRestSpread',
  'optionalCatchBinding',
  'optionalChaining',
  ['pipelineOperator', { proposal: 'minimal' }],
  'throwExpressions',
];

const getVersionFromComments = (comments: Array<{ value: string }>) => {
  return comments &&
    comments[0] &&
    /^\s*((\d+\.)?(\d+\.)?(\*|\d+))|(LATEST)\s*$/.test(comments[0].value)
    ? comments[0].value.trim()
    : null;
};

const isValidBundle = (name: any) => {
  if (typeof name !== 'string') {
    return false;
  }

  const match = /^(?:@([^/?]+)\/)?([^@/?]+)(?:\/([^@]+))?/.exec(name);
  const fullName = match ? (match[1] ? `@${match[1]}/` : '') + match[2] : null;

  return validate(fullName).validForOldPackages;
};

const removeCommentFromPath = (path: any) => {
  let node;

  if (path.node.type === 'CallExpression') {
    const { parentPath } = path;

    if (parentPath.node.type === 'VariableDeclarator') {
      node = parentPath.parentPath.node;
    } else {
      node = parentPath.node;
    }
  } else {
    node = path.node;
  }

  node.comments = node.comments || [];
  node.comments = node.comments.filter(
    (comment: any) => !(comment.type === 'CommentLine' && comment.trailing)
  );
};

const findDependencies = (
  code: string,
  filename: string,
  removeVersionComments: boolean = false
): { dependencies: { [key: string]: string | null }; code: string } => {
  const babylonPlugins = [...parserPlugins];
  const language = getFileLanguage(filename);

  if (language === 'typescript') {
    babylonPlugins.push('typescript');

    if (filename.endsWith('.tsx')) {
      babylonPlugins.push('jsx');
    }
  } else {
    babylonPlugins.push('flow', 'jsx');
  }

  const parser = {
    parse: (code: string) =>
      // @ts-ignore
      babylon.parse(code, {
        sourceType: 'module',
        plugins: babylonPlugins,
      }),
  };

  const dependencies: { [key: string]: string | null } = {};
  const ast = parse(code, { parser });

  const findModuleFromRequire = (path: any) => {
    const { callee, arguments: args } = path.node;

    let name;

    if (callee.name === 'require' && args.length === 1) {
      if (args[0].type === 'Literal' || args[0].type === 'StringLiteral') {
        name = args[0].value;
      } else if (args[0].type === 'TemplateLiteral' && args[0].quasis.length === 1) {
        name = args[0].quasis[0].value.cooked;
      }
    }

    if (name) {
      const version = getVersionFromComments(
        (args[0] && args[0].trailingComments) || path.parentPath.parentPath.node.trailingComments
      );

      if (removeVersionComments) {
        removeCommentFromPath(path);
      }

      dependencies[name] = version;
    }
  };

  const findModuleFromImport = (path: any) => {
    const name = path.node.source && path.node.source.value;

    if (name) {
      const version = getVersionFromComments(path.node.trailingComments);

      if (removeVersionComments) {
        removeCommentFromPath(path);
      }

      dependencies[name] = version;
    }
  };

  types.visit(ast, {
    visitImportDeclaration(path) {
      findModuleFromImport(path);
      this.traverse(path);
    },

    visitExportNamedDeclaration(path) {
      findModuleFromImport(path);
      this.traverse(path);
    },

    visitExportAllDeclaration(path) {
      findModuleFromImport(path);
      this.traverse(path);
    },

    visitCallExpression(path) {
      findModuleFromRequire(path);
      this.traverse(path);
    },
  });

  return {
    dependencies: pickBy(dependencies, (_, key) => isValidBundle(key)),
    code: removeVersionComments ? print(ast).code : code,
  };
};

export default findDependencies;
