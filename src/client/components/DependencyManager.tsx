import * as React from 'react';
import debounce from 'lodash/debounce';
import pickBy from 'lodash/pickBy';
import mapValues from 'lodash/mapValues';
import flatMap from 'lodash/flatMap';
import { isModulePreloaded } from 'snack-sdk';
import Toast from './shared/Toast';
import KeybindingsManager, { KeyMap } from './shared/KeybindingsManager';
import ShortcutLabel from './shared/ShortcutLabel';
import updateEntry from '../actions/updateEntry';
import getSnackURLFromEmbed from '../utils/getSnackURLFromEmbed';
import { isPackageJson, isScriptFile } from '../utils/fileUtilities';
import FeatureFlags from '../utils/FeatureFlags';
import { SDKVersion } from '../configs/sdk';
import { FileSystemEntry, TextFileEntry } from '../types';

type Props = {
  initialSdkVersion: SDKVersion;
  sdkVersion: SDKVersion;
  dependencyQueryParam: string | undefined;
  fileEntries: FileSystemEntry[];
  onEntriesChange: (x0: FileSystemEntry[]) => Promise<void>;
  dependencies: {
    [name: string]: {
      version: string;
    };
  };
  syncDependenciesAsync: (
    modules: {
      [name: string]: string | undefined;
    },
    onError: (name: string, e: Error) => void
  ) => Promise<void>;
  onOpenFullView?: () => void;
  sessionID?: string;
};

type DependencyStatus = {
  status: 'added' | 'resolving' | 'error' | 'denied';
  version?: string;
  origin?: string;
};

type State = {
  dependencies: { [key: string]: DependencyStatus };
};

const installAll = {
  type: 'installAll',
  combo: [KeyMap.Meta, KeyMap.Enter],
};
const cmdEnter = ShortcutLabel({ combo: installAll.combo });

export default class DependencyManager extends React.Component<Props, State> {
  state: State = {
    dependencies: {},
  };

  componentDidMount() {
    if (FeatureFlags.isAvailable('PROJECT_DEPENDENCIES', this.props.initialSdkVersion)) {
      if (this.props.dependencyQueryParam) {
        this._syncDependencyQueryParam(this.props.dependencyQueryParam);
      } else {
        // @ts-ignore
        this._syncPackageJson(this.props.fileEntries.find(e => isPackageJson(e.item.path)));
      }

      this._findNewDependencies(this.props.fileEntries.filter(entry => isScriptFile(entry)));
    } else {
      this._handleVersionComments();
    }
  }

  componentDidUpdate(prevProps: Props) {
    // @ts-ignore
    const prevPackageJson: TextFileEntry | undefined = prevProps.fileEntries.find(e =>
      isPackageJson(e.item.path)
    );

    // @ts-ignore
    const packageJson: TextFileEntry | undefined = this.props.fileEntries.find(e =>
      isPackageJson(e.item.path)
    );

    if (
      packageJson &&
      prevPackageJson &&
      packageJson.item.content !== prevPackageJson.item.content
    ) {
      this._syncPackageJson(packageJson);
    } else {
      let changedEntries;

      if (this.props.sdkVersion !== prevProps.sdkVersion) {
        changedEntries = this.props.fileEntries.filter(entry => isScriptFile(entry));
      } else if (this.props.fileEntries !== prevProps.fileEntries) {
        // Find dependencies for new or changed files
        changedEntries = this.props.fileEntries.filter(
          entry =>
            // If file doesn't exist in previous entry list, then it's new or changed
            isScriptFile(entry) && !prevProps.fileEntries.includes(entry)
        );
      }

      if (changedEntries && changedEntries.length) {
        this._findNewDependencies(changedEntries);
      }
    }
  }

  _syncDependencyQueryParam = async (dependencyQueryParam: string | undefined) => {
    if (!dependencyQueryParam) {
      return;
    }

    // If any initial dependencies were specified in query param, sync them
    // Dependencies will be in following format:
    // dependencies=lodash,redux@0.3.4,@expo/fonts@4.3.2
    const dependencies = dependencyQueryParam.split(',').reduce((acc, curr) => {
      const first = curr.slice(0, 1);

      // remove the first letter so we don't match stuff like `@expo/` when splitting
      const [dep, version] = curr.slice(1).split('@');
      const name = first + dep;

      if (isModulePreloaded(name, this.props.sdkVersion)) {
        return acc;
      }

      return {
        ...acc,
        [name]: version || null,
      };
    }, {});

    this._syncDependencies(dependencies);
  };

  _syncPackageJsonNotDebounced = async (packageJson: TextFileEntry | undefined) => {
    if (!packageJson) {
      return;
    }

    let dependencies;

    try {
      dependencies = JSON.parse(packageJson.item.content).dependencies;
    } catch (e) {
      return;
    }

    if (typeof dependencies === 'object' && dependencies != null) {
      this._syncDependencies(dependencies);
    }
  };

  _syncPackageJson = debounce(this._syncPackageJsonNotDebounced, 1000);

  _handleVersionComments = async () => {
    const { default: findDependencies } = await import('../utils/findDependencies');

    const deps = {};
    const newEntries = this.props.fileEntries.map(entry => {
      if (isScriptFile(entry)) {
        const { code, dependencies } = findDependencies(entry.item.content, entry.item.path, true);

        if (code !== entry.item.content) {
          return updateEntry(entry, {
            item: {
              content: code,
            },
          });
        }

        Object.assign(deps, dependencies);
      }

      return entry;
    });

    this.props.onEntriesChange(newEntries);
    this._syncDependencies(
      // @ts-ignore
      pickBy(deps, (_, name) => !isModulePreloaded(name, this.props.sdkVersion))
    );
  };

  _findNewDependenciesNotDebounced = async (fileEntries: FileSystemEntry[]) => {
    const { default: findDependencies } = await import('../utils/findDependencies');

    this.setState(state => {
      const origins = fileEntries.map(entry => entry.item.path);

      // Filter out dependencies from current file
      // This makes sure that we don't show dependencies that are no longer mentioned
      const dependencies = pickBy(
        state.dependencies,
        value => value.origin && !origins.includes(value.origin)
      );

      try {
        return {
          dependencies: {
            ...dependencies,
            ...flatMap(
              fileEntries,
              (
                entry: FileSystemEntry
              ): Array<{
                name: string;
                origin: string;
              }> => {
                if (isScriptFile(entry) && typeof entry.item.content === 'string') {
                  // Get the list of dependencies the file
                  const { dependencies: deps } = findDependencies(
                    entry.item.content,
                    entry.item.path
                  );

                  return Object.keys(deps).map(name => ({
                    name,
                    origin: entry.item.path,
                    version: deps[name],
                  }));
                }

                return [];
              }
            )
              .filter(
                ({ name }) =>
                  // If the dependency is already in props, or is in progress, don't add them
                  !(
                    dependencies[name] ||
                    this.props.dependencies[name] ||
                    isModulePreloaded(name, this.props.sdkVersion)
                  )
              )
              // Find new dependencies and schedule them to add
              .reduce((acc: { [name: string]: DependencyStatus }, { name, origin }) => {
                // If the dependency had a status before, preserve it
                // This makes sure not to add deps we denied earlier and were not removed from the file
                acc[name] = state.dependencies[name] || { status: 'added', origin };
                return acc;
              }, {}),
          },
        };
      } catch (e) {
        return state;
      }
    });
  };

  _findNewDependencies = debounce(this._findNewDependenciesNotDebounced, 1000);

  _syncDependencies = async (
    dependencies: {
      [name: string]: string | undefined;
    },
    only?: string[]
  ) => {
    this.setState(state => ({
      dependencies: {
        ...state.dependencies,
        ...Object.keys(dependencies).reduce(
          (acc, name) => ({
            ...acc,
            [name]:
              !only || only.includes(name) || !state.dependencies[name]
                ? {
                    ...state.dependencies[name],
                    version: dependencies[name],
                    status: 'resolving',
                  }
                : state.dependencies[name],
          }),
          {}
        ),
      },
    }));

    const failures: string[] = [];

    try {
      await this.props.syncDependenciesAsync(dependencies, name => {
        failures.push(name);

        this.setState(state => ({
          dependencies: {
            ...state.dependencies,
            [name]: {
              ...state.dependencies[name],
              status: 'error',
            },
          },
        }));
      });
    } finally {
      // Remove dependencies we were resolving that didn't fail
      this.setState(state => ({
        dependencies: {
          ...pickBy(
            state.dependencies,
            (value, key: string) => value.status !== 'resolving' || failures.includes(key)
          ),
        },
      }));
    }
  };

  _handleAddDependency = (name: string) => {
    this._syncDependencies(
      {
        ...mapValues(this.props.dependencies, o => o.version),
        [name]: undefined,
      },
      [name]
    );
  };

  _handleRetryDependency = (name: string) => {
    // Get the existing version of the dep it's there
    const existing = this.state.dependencies[name];
    const version = existing ? existing.version : undefined;

    this._syncDependencies(
      {
        ...mapValues(this.props.dependencies, o => o.version),
        [name]: version,
      },
      [name]
    );
  };

  _handleDenyAdding = (name: string) =>
    this.setState(state => ({
      dependencies: {
        ...state.dependencies,
        [name]: {
          ...state.dependencies[name],
          status: 'denied',
        },
      },
    }));

  _handleDismissDependencyError = (name: string) =>
    this.setState(state => ({
      dependencies: pickBy(state.dependencies, (_, key: string) => name !== key),
    }));

  _handleAddAll = async () =>
    this._syncDependencies({
      ...mapValues(this.props.dependencies, o => o.version),
      ...Object.keys(this.state.dependencies)
        .filter(name => {
          const dep = this.state.dependencies[name];
          return dep ? dep.status === 'added' || dep.status === 'error' : false;
        })
        .reduce(
          (dependencies, name) => ({
            ...dependencies,
            [name]: undefined,
          }),
          {}
        ),
    });

  _handleOpenFullEditor = () => {
    if (!this.props.onOpenFullView || !this.props.sessionID) {
      return;
    }
    this.props.onOpenFullView();

    const link = document.createElement('a');

    link.target = '_blank';
    link.href = getSnackURLFromEmbed(this.props.sessionID);

    link.click();
  };

  render() {
    const { dependencies } = this.state;
    const names = Object.keys(dependencies).filter(name => {
      const dep = this.state.dependencies[name];
      return dep ? dep.status === 'added' || dep.status === 'error' : false;
    });

    return (
      <div>
        <KeybindingsManager bindings={[installAll]} onTrigger={this._handleAddAll} />
        {names.length && this.props.onOpenFullView ? (
          <Toast
            persistent
            label={<span>Open full editor to add new modules</span>}
            actions={[
              {
                label: `Open`,
                action: this._handleOpenFullEditor,
              },
            ]}
          />
        ) : (
          names.map(
            name =>
              dependencies[name].status === 'error' ? (
                <Toast
                  key={name}
                  persistent
                  type="error"
                  label={
                    <span>
                      An error occured when resolving{' '}
                      <code>
                        {name}
                        {dependencies[name].version ? `@${dependencies[name].version}` : ''}
                      </code>
                    </span>
                  }
                  actions={[
                    {
                      label: `Retry ${cmdEnter}`,
                      action: () => this._handleRetryDependency(name),
                    },
                    { label: 'Dismiss' },
                  ]}
                  onDismiss={() => this._handleDismissDependencyError(name)}
                />
              ) : (
                <Toast
                  key={name}
                  persistent
                  label={
                    <span>
                      Add <code>{name}</code> to package.json?
                    </span>
                  }
                  actions={[
                    {
                      label: `Add ${cmdEnter}`,
                      action: () => this._handleAddDependency(name),
                    },
                    { label: 'Cancel' },
                  ]}
                  onDismiss={() => this._handleDenyAdding(name)}
                />
              )
          )
        )}
      </div>
    );
  }
}
