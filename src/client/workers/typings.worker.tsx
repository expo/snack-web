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

type FileMetadata = {
  [key: string]: File;
};

self.importScripts(resources.typescript);

const ROOT_URL = `https://cdn.jsdelivr.net/`;

const store = new Store('typescript-definitions-cache-v1');
const cache = new Map<string, Promise<string>>();

const fetchAsText = (url: string): Promise<string> => {
  const cached = cache.get(url);

  if (cached) {
    // If we have a promise cached for the URL, return it
    return cached;
  }

  const promise = fetch(url).then(response => {
    if (response.ok) {
      // If response was successful, get the response text
      return response.text();
    }

    throw new Error(response.statusText || `Request failed with status: ${response.status}`);
  });

  // Cache the promise for the URL for subsequent requests
  cache.set(url, promise);

  return promise;
};

// Fetch definitions published to npm from DefinitelyTyped (@types/x)
const fetchFromDefinitelyTyped = (dependency: string, _: string, fetchedPaths: FetchedPaths) =>
  fetchAsText(
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
      case ts.SyntaxKind.ImportDeclaration:
        requires.push(node.moduleSpecifier.text);
        break;
      case ts.SyntaxKind.ExportDeclaration:
        // For syntax 'export ... from '...'''
        if (node.moduleSpecifier) {
          requires.push(node.moduleSpecifier.text);
        }
        break;
    }
  });

  return requires;
};

const getFileMetaData = (
  dependency: string,
  version: string,
  depPath: string
): Promise<FileMetadata> =>
  fetchAsText(`https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`)
    .then((response: string) => JSON.parse(response))
    .then((response: { files: File[] }) => response.files.filter(f => f.name.startsWith(depPath)))
    .then((files: File[]) => {
      const finalObj: FileMetadata = {};

      files.forEach(d => {
        finalObj[d.name] = d;
      });

      return finalObj;
    });

const resolveAppropiateFile = (fileMetaData: FileMetadata, relativePath: string) => {
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
  fileMetaData: FileMetadata
): Promise<any> => {
  const virtualPath = path.join('node_modules', dependency, depPath);

  if (fetchedPaths[virtualPath]) {
    return Promise.resolve();
  }

  return fetchAsText(`${depUrl}/${depPath}`).then(
    (content: string): any => {
      if (fetchedPaths[virtualPath]) {
        return;
      }

      fetchedPaths[virtualPath] = content;

      // Now find all require statements, so we can download those types too
      return Promise.all(
        getRequireStatements(depPath, content)
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
    }
  );
};

function fetchFromMeta(dependency: string, version: string, fetchedPaths: FetchedPaths) {
  return fetchAsText(`https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`).then(
    (response: string) => {
      const meta: { files: File[] } = JSON.parse(response);

      // Get the list of matching files in the package as a flat array
      const filterAndFlatten = (files: File[], filter: RegExp) =>
        files.reduce((paths: string[], file: File) => {
          if (filter.test(file.name)) {
            paths.push(file.name);
          }

          return paths;
        }, []);

      // Get the list of .d.ts files in the package
      let declarations = filterAndFlatten(meta.files, /\.d\.ts$/);

      if (declarations.length === 0) {
        // If no .d.ts files found, fallback to .ts files
        declarations = filterAndFlatten(meta.files, /\.ts$/);
      }

      if (declarations.length === 0) {
        throw new Error(`No inline typings found for ${dependency}@${version}`);
      }

      // Also add package.json so TypeScript can find the correct entry file
      declarations.push('/package.json');

      return Promise.all(
        declarations.map(file =>
          fetchAsText(`${ROOT_URL}npm/${dependency}@${version}${file}`).then(
            (content: string): [string, string] => [`node_modules/${dependency}${file}`, content]
          )
        )
      ).then((items: Array<[string, string]>) => {
        items.forEach(([key, value]) => {
          fetchedPaths[key] = value;
        });
      });
    }
  );
}

function fetchFromTypings(dependency: string, version: string, fetchedPaths: FetchedPaths) {
  const depUrl = `${ROOT_URL}npm/${dependency}@${version}`;

  return fetchAsText(`${depUrl}/package.json`)
    .then((response: string) => JSON.parse(response))
    .then((packageJSON: { typings?: string; types?: string }) => {
      const types = packageJSON.typings || packageJSON.types;

      if (types) {
        // Add package.json, since this defines where all types lie
        fetchedPaths[`node_modules/${dependency}/package.json`] = JSON.stringify(packageJSON);

        // Get all files in the specified directory
        return getFileMetaData(dependency, version, path.join('/', path.dirname(types))).then(
          (fileMetaData: FileMetadata) =>
            getFileTypes(
              depUrl,
              dependency,
              resolveAppropiateFile(fileMetaData, types),
              fetchedPaths,
              fileMetaData
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

      let fetchPromise: Promise<void>;

      if (name === 'expo') {
        // Temporarily force download type definitions from DefinitelyTyped for expo
        // Types are shipped with the 'expo' package, but they are highly incomplete
        fetchPromise = fetchFromDefinitelyTyped(name, version, fetchedPaths);
      } else {
        // Try checking the types/typings entry in package.json for the declarations
        fetchPromise = fetchFromTypings(name, version, fetchedPaths)
          .catch(() =>
            // Not available in package.json, try checking meta for inline .d.ts files
            fetchFromMeta(name, version, fetchedPaths)
          )
          .catch(() =>
            // Not available in package.json or inline from meta, try checking in @types/
            fetchFromDefinitelyTyped(name, version, fetchedPaths)
          );
      }

      return fetchPromise.then(() => {
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
