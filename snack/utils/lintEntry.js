/* @flow */

import { isPackageJson } from './fileUtilities';
import lintCode from './lintCode';
import lintPackageJson from './lintPackageJson';
import type { FileSystemEntry } from '../types';
import type { SDKVersion } from '../configs/sdk';

const isJSFile = (entry: *) => entry && !entry.item.asset && entry.item.path.endsWith('.js');
const isJSONFile = (entry: *) => entry && !entry.item.asset && entry.item.path.endsWith('.json');

export default async function lintEntry(entry: FileSystemEntry, sdkVersion: SDKVersion) {
  if (isJSFile(entry)) {
    /* $FlowFixMe */
    return lintCode(entry.item.content);
  } else if (isJSONFile(entry) && isPackageJson(entry.item.path)) {
    /* $FlowFixMe */
    return lintPackageJson(entry.item.content, sdkVersion);
  }

  return [];
}
