import { isPackageJson, isESLintConfig, isJSFile, isJSONFile } from './fileUtilities';
import { FileSystemEntry, TextFileEntry } from '../types';
import { SDKVersion } from '../configs/sdk';

export default async function lintEntry(
  focusedEntry: FileSystemEntry | undefined,
  fileEntries: FileSystemEntry[],
  sdkVersion: SDKVersion
) {
  if (isJSFile(focusedEntry)) {
    const { default: lintCode } = await import('./lintCode');
    const eslintrc = fileEntries.find(e => isESLintConfig(e.item.path)) as
      | TextFileEntry
      | undefined;

    let config;

    if (eslintrc) {
      try {
        config = JSON.parse(eslintrc.item.content);

        // Use the babel-eslint parser by default since it's what we bundle
        // This avoids having to specify the parser which might not be obvious
        config = { parser: 'babel-eslint', ...config };
      } catch (e) {
        return [
          {
            startLineNumber: 0,
            endLineNumber: 0,
            startColumn: 0,
            endColumn: 0,
            severity: 3,
            message: `Content of the ESLint config (${eslintrc.item.path}) is not valid JSON`,
            source: 'ESLint',
          },
        ];
      }
    }

    return lintCode(focusedEntry.item.content, config);
  } else if (isJSONFile(focusedEntry) && isPackageJson(focusedEntry.item.path)) {
    const { default: lintPackageJson } = await import('./lintPackageJson');
    return lintPackageJson(focusedEntry.item.content, sdkVersion);
  }

  return [];
}
