import { isPackageJson, isJSFile, isJSONFile } from './fileUtilities';
import lintCode from './lintCode';
import lintPackageJson from './lintPackageJson';
import { FileSystemEntry } from '../types';
import { SDKVersion } from '../configs/sdk';

export default async function lintEntry(entry: FileSystemEntry, sdkVersion: SDKVersion) {
  if (isJSFile(entry)) {
    return lintCode(entry.item.content);
  } else if (isJSONFile(entry) && isPackageJson(entry.item.path)) {
    return lintPackageJson(entry.item.content, sdkVersion);
  }

  return [];
}
