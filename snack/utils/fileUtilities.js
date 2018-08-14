/* @flow */

import escapeRegExp from 'escape-string-regexp';

export function isInsideFolder(path: string, folderPath: string) {
  return path.startsWith(`${folderPath}/`);
}

export function getParentPath(path: string): ?string {
  return path.includes('/') ? path.replace(/\/[^/]+$/, '') : null;
}

export function changeParentPath(path: string, oldParentPath: string, newParentPath: string) {
  return path.replace(new RegExp('^' + escapeRegExp(oldParentPath + '/')), newParentPath + '/');
}

export function getUniquePath(allPaths: string[], suggestedPath: string, initialSuffix?: string) {
  const parts = suggestedPath.includes('.') ? suggestedPath.split('.') : null;
  const ext = parts ? parts.pop() : '';
  const initialPath = parts ? parts.join('.') : suggestedPath;

  let path = suggestedPath;
  let counter = initialSuffix ? 0 : 1;

  while (allPaths.some(p => p.toLowerCase() === path.toLowerCase())) {
    const suffix = `${initialSuffix || ''} ${counter || ''}`.trim();

    if (ext) {
      path = `${initialPath} ${suffix}.${ext}`;
    } else {
      path = `${initialPath} ${suffix}`;
    }

    counter++;
  }

  return path;
}

export function isEntryPoint(name: string): boolean {
  return name === 'App.js';
}

export function isPackageJson(name: string): boolean {
  return name === 'package.json';
}

export function isImage(name: string): boolean {
  return /\.(bmp|jpg|jpeg|png|gif|svg)$/.test(name);
}
