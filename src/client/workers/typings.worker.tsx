import path from 'path';
import { Store, set as setItem, get as getItem } from 'idb-keyval';
import resources from '../../../resources.json';

declare const self: DedicatedWorkerGlobalScope;
declare const ts: any;

type FetchedPaths = {
  [key: string]: string;
};

type File = {
  name: string;
  type: string;
  path: string;
};

self.importScripts(resources.typescript);

const ROOT_URL = `https://cdn.jsdelivr.net/`;

const store = new Store('typescript-definitions-cache-v1');
const fetchCache = new Map();

const doFetch = (url: string) => {
  const cached = fetchCache.get(url);

  if (cached) {
    return cached;
  }

  const promise = fetch(url)
    .then(response => {
      if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
      }

      const error = new Error(String(response.statusText || response.status));

      return Promise.reject(error);
    })
    .then(response => response.text());

  fetchCache.set(url, promise);

  return promise;
};

const fetchFromDefinitelyTyped = (dependency: string, _: string, fetchedPaths: FetchedPaths) =>
  doFetch(
    `${ROOT_URL}npm/@types/${dependency.replace('@', '').replace(/\//g, '__')}/index.d.ts`
  ).then((typings: string) => {
    fetchedPaths[`node_modules/${dependency}/index.d.ts`] = typings;
  });

const getRequireStatements = (title: string, code: string) => {
  const requires: string[] = [];

  const sourceFile = ts.createSourceFile(
    title,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  ts.forEachChild(sourceFile, (node: any) => {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        requires.push(node.moduleSpecifier.text);
        break;
      }
      case ts.SyntaxKind.ExportDeclaration: {
        // For syntax 'export ... from '...'''
        if (node.moduleSpecifier) {
          requires.push(node.moduleSpecifier.text);
        }
        break;
      }
      default: {
        /* */
      }
    }
  });

  return requires;
};

const tempTransformFiles = (files: File[]) => {
  const finalObj: { [key: string]: { name: string } } = {};

  files.forEach(d => {
    finalObj[d.name] = d;
  });

  return finalObj;
};

const transformFiles = (dir: any) =>
  dir.files
    ? dir.files.reduce((prev: { [key: string]: File }, next: File) => {
        if (next.type === 'file') {
          return { ...prev, [next.path]: next };
        }

        return { ...prev, ...transformFiles(next) };
      }, {})
    : {};

const getFileMetaData = (dependency: string, version: string, depPath: string) =>
  doFetch(`https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`)
    .then((response: string) => JSON.parse(response))
    .then((response: { files: File[] }) => response.files.filter(f => f.name.startsWith(depPath)))
    .then(tempTransformFiles);

const resolveAppropiateFile = (fileMetaData: { [key: string]: File }, relativePath: string) => {
  const absolutePath = `/${relativePath}`;

  if (fileMetaData[`${absolutePath}.d.ts`]) {
    return `${relativePath}.d.ts`;
  }
  if (fileMetaData[`${absolutePath}.ts`]) {
    return `${relativePath}.ts`;
  }
  if (fileMetaData[absolutePath]) {
    return relativePath;
  }
  if (fileMetaData[`${absolutePath}/index.d.ts`]) {
    return `${relativePath}/index.d.ts`;
  }

  return relativePath;
};

const getFileTypes = (
  depUrl: string,
  dependency: string,
  depPath: string,
  fetchedPaths: FetchedPaths,
  fileMetaData: { [key: string]: File }
) => {
  const virtualPath = path.join('node_modules', dependency, depPath);

  if (fetchedPaths[virtualPath]) {
    return null;
  }

  return doFetch(`${depUrl}/${depPath}`).then((typings: string) => {
    if (fetchedPaths[virtualPath]) {
      return null;
    }

    fetchedPaths[virtualPath] = typings;

    // Now find all require statements, so we can download those types too
    return Promise.all(
      getRequireStatements(depPath, typings)
        .filter(
          // Don't add global deps
          dep => dep.startsWith('.')
        )
        .map(relativePath => path.join(path.dirname(depPath), relativePath))
        .map(relativePath => resolveAppropiateFile(fileMetaData, relativePath))
        .map(nextDepPath =>
          getFileTypes(depUrl, dependency, nextDepPath, fetchedPaths, fileMetaData)
        )
    );
  });
};

function fetchFromMeta(dependency: string, version: string, fetchedPaths: FetchedPaths) {
  const depUrl = `https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`;

  return doFetch(depUrl)
    .then((response: string) => JSON.parse(response))
    .then((meta: { files: File[] }) => {
      const filterAndFlatten = (files: File[], filter: RegExp) =>
        files.reduce((paths: string[], file: File) => {
          if (filter.test(file.name)) {
            paths.push(file.name);
          }
          return paths;
        }, []);

      let dtsFiles = filterAndFlatten(meta.files, /\.d\.ts$/);
      if (dtsFiles.length === 0) {
        // if no .d.ts files found, fallback to .ts files
        dtsFiles = filterAndFlatten(meta.files, /\.ts$/);
      }

      if (dtsFiles.length === 0) {
        throw new Error(`No inline typings found for ${dependency}@${version}`);
      }

      dtsFiles.forEach(file => {
        doFetch(`https://cdn.jsdelivr.net/npm/${dependency}@${version}${file}`)
          .then((dtsFile: string) => {
            fetchedPaths[`node_modules/${dependency}${file}`] = dtsFile;
          })
          .catch(() => undefined);
      });
    });
}

function fetchFromTypings(dependency: string, version: string, fetchedPaths: FetchedPaths) {
  const depUrl = `${ROOT_URL}npm/${dependency}@${version}`;

  return doFetch(`${depUrl}/package.json`)
    .then((response: string) => JSON.parse(response))
    .then((packageJSON: { typings?: string; types?: string }) => {
      const types = packageJSON.typings || packageJSON.types;
      if (types) {
        // Add package.json, since this defines where all types lie
        fetchedPaths[`node_modules/${dependency}/package.json`] = JSON.stringify(packageJSON);

        // get all files in the specified directory
        return getFileMetaData(dependency, version, path.join('/', path.dirname(types))).then(
          (fileData: any) =>
            getFileTypes(
              depUrl,
              dependency,
              resolveAppropiateFile(fileData, types),
              fetchedPaths,
              fileData
            )
        );
      }

      throw new Error(`No typings field in package.json for ${dependency}@${version}`);
    });
}

function fetchDefinitions(name: string, version: string) {
  if (!version) {
    return Promise.reject(new Error(`No version specified for ${name}`));
  }

  // Query cache for the defintions
  const key = `${name}@${version}`;

  return getItem(key, store)
    .catch(e => {
      console.error('An error occurred when getting definitions from cache', e);
    })
    .then(result => {
      if (result) {
        return result;
      }

      // If result is empty, fetch from remote
      const fetchedPaths = {};

      return fetchFromTypings(name, version, fetchedPaths)
        .catch(() =>
          // not available in package.json, try checking meta for inline .d.ts files
          fetchFromMeta(name, version, fetchedPaths)
        )
        .catch(() =>
          // Not available in package.json or inline from meta, try checking in @types/
          fetchFromDefinitelyTyped(name, version, fetchedPaths)
        )
        .then(() => {
          if (Object.keys(fetchedPaths).length) {
            // Also cache the definitions
            setItem(key, fetchedPaths, store);

            return fetchedPaths;
          } else {
            throw new Error(`Type definitions are empty for ${key}`);
          }
        });
    });
}

self.addEventListener('message', event => {
  const { name, version } = event.data;

  fetchDefinitions(name, version).then(
    result =>
      self.postMessage({
        name,
        version,
        typings: result,
      }),
    error => {
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }
    }
  );
});
