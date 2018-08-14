/* @flow */

export type WebkitDirectoryReader = {
  readEntries: (
    success: (result: Array<WebkitFileEntry | WebkitDirectoryEntry>) => mixed,
    error: (e: Error) => mixed
  ) => void,
};

export type WebkitFileEntry = {|
  isFile: true,
  isDirectory: false,
  name: string,
  fullPath: string,
  file: (success: (f: File) => mixed, success: (e: Error) => mixed) => mixed,
|};

export type WebkitDirectoryEntry = {|
  isFile: false,
  isDirectory: true,
  name: string,
  fullPath: string,
  createReader: () => WebkitDirectoryReader,
|};

const blacklist = [
  /^\./, // hidden files
  /\.(jks|keystore)$/, // android keystore
  /^(android|ios)$/, // native code
  /^coverage$/, // code ceoverage
  /^(js|ts)config\.json$/, // vscode config
  /^flow-typed$/, // flow type definitions
  /^node_modules$/, // third party modules
  /^npm-debug\.log$/, // npm debug log
  /^npm-error\.log$/, // npm error log
  /^package-lock\.json$/, // npm package metadata
  /^yarn-debug\.log$/, // yarn debug log
  /^yarn-error\.log$/, // yarn error log
  /^yarn\.lock$/, // yarn package metadata
  /^__tests__$/, // jest tests
  /~$/, // hidden and backup files
];

const processEntry = async (
  entry: WebkitFileEntry | WebkitDirectoryEntry,
  files: Array<{ file: File, path: string }>,
  path: string
) => {
  if (blacklist.some(r => r.test(entry.name))) {
    return;
  }

  if (entry.isFile) {
    const file = await new Promise((resolve, reject) =>
      /* $FlowFixMe */
      entry.file(resolve, reject)
    );
    files.push({
      path,
      file,
    });
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    const entries = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
    await Promise.all(
      entries.map(async (e: WebkitFileEntry | WebkitDirectoryEntry) =>
        processEntry(e, files, `${path}/${e.name}`)
      )
    );
  }
};

export default async function convertDataTransferItemsToFiles(
  items: Array<File | WebkitFileEntry | WebkitDirectoryEntry>,
  mappings: { [key: string]: string }
) {
  const files: Array<{ file: File, path: string }> = [];
  await Promise.all(
    items.map(it => {
      const path = mappings[it.name] || it.name;
      if (it instanceof File) {
        files.push({
          file: it,
          path,
        });
      } else {
        return processEntry(it, files, path);
      }
    })
  );
  return files;
}
