/* @flow */
/* eslint-disable flowtype/generic-spacing */

import type { SDKVersion } from './configs/sdk';
import type { ThemeName } from './components/Preferences/withThemeName';

// TODO: unify with snack-sdk.types
type RequiredSnackFileAttributes = {
  contents: string,
  type: 'ASSET' | 'CODE',
};

export type ExpoSnackFiles = {
  ...{ [string]: RequiredSnackFileAttributes },
};

export type Snack = {
  id: string,
  created: string,
  code?: ExpoSnackFiles,
  manifest?: {
    name: string,
    description: string,
    sdkVersion?: SDKVersion,
  },
  dependencies?: { [key: string]: string },
  history?: Array<{ id: string, savedAt: string }>,
  isDraft?: boolean,
};

export type FileSystemItem<E, S> = {| item: E, state: S |};

export type TextFileEntry = {|
  +item: {|
    +path: string,
    +type: 'file',
    +content: string,
    +virtual?: true,
  |},
  +state: {|
    +isOpen?: boolean, // If file is open in an editor tab
    +isFocused?: boolean, // If file is focused in the editor
    +isSelected?: boolean, // If file is selected for manipulation
    +isCreating?: boolean, // If file is being created
  |},
|};

export type AssetFileEntry = {|
  +item: {|
    +path: string,
    +type: 'file',
    +uri: string,
    +asset: true,
  |},
  +state: {|
    +isOpen?: boolean, // If file is open in an editor tab
    +isFocused?: boolean, // If file is focused in the editor
    +isSelected?: boolean, // If file is selected for manipulation
    +isCreating?: boolean, // If file is in the process of being created
  |},
|};

export type FolderEntry = {|
  +item: {|
    +path: string,
    +type: 'folder',
  |},
  +state: {|
    +isOpen?: boolean, // If file is open in an editor tab
    +isFocused?: boolean, // If file is focused in the editor
    +isExpanded?: boolean, // If folder is expanded to show it's children
    +isSelected?: boolean, // if folder is selected for manipulation
    +isCreating?: boolean, // If folder is being created
  |},
|};

export type FileSystemEntry = TextFileEntry | AssetFileEntry | FolderEntry;

export type Viewer = {
  username: string,
  nickname: string,
  picture?: string,
  user_metadata?: {
    appetize_code: string,
  },
};

export type QueryParams = {|
  session_id?: string,
  local_snackager?: 'true' | 'false',
  preview?: 'true' | 'false',
  platform?: 'android' | 'ios',
  code?: string,
  name?: string,
  description?: string,
  sdkVersion?: SDKVersion,
  appetizePayerCode?: string,
  iframeId?: string,
  waitForData?: 'boolean',
  theme?: ThemeName,
|};

export type SaveStatus = 'changed' | 'saving-draft' | 'saved-draft' | 'publishing' | 'published';
