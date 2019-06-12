import { SDKVersion } from './configs/sdk';
import { ThemeName } from './components/Preferences/withThemeName';

type RequiredSnackFileAttributes = {
  contents: string;
  type: 'ASSET' | 'CODE';
};

export type ExpoSnackFiles = {
  [x: string]: RequiredSnackFileAttributes;
};

export type Snack = {
  id: string;
  created: string;
  code?: ExpoSnackFiles;
  manifest?: {
    name: string;
    description: string;
    sdkVersion?: SDKVersion;
  };
  dependencies?: {
    [key: string]: string;
  };
  history?: SaveHistory;
  isDraft?: boolean;
};

export type TextFileEntry = Readonly<{
  item: {
    path: string;
    type: 'file';
    content: string;
    virtual?: true;
    asset?: false;
  };
  state: {
    isOpen?: boolean;
    isFocused?: boolean;
    isSelected?: boolean;
    isCreating?: boolean;
    isExpanded?: false;
  };
}>;

export type AssetFileEntry = Readonly<{
  item: {
    path: string;
    type: 'file';
    uri: string;
    asset: true;
    virtual?: true;
  };
  state: {
    isOpen?: boolean;
    isFocused?: boolean;
    isSelected?: boolean;
    isCreating?: boolean;
    isExpanded?: false;
  };
}>;

export type FolderEntry = Readonly<{
  item: {
    path: string;
    type: 'folder';
    asset?: false;
    virtual?: false;
  };
  state: {
    isOpen?: boolean;
    isFocused?: boolean;
    isExpanded?: boolean;
    isSelected?: boolean;
    isCreating?: boolean;
  };
}>;

export type FileSystemEntry = TextFileEntry | AssetFileEntry | FolderEntry;

export type Viewer = {
  username: string;
  nickname: string;
  picture?: string;
  user_metadata?: {
    appetize_code: string;
  };
};

export type Platform = 'android' | 'ios' | 'web';

export type Device = {
  name: string;
  id: string;
  platform: Platform;
};

export type QueryParams = {
  session_id?: string;
  local_snackager?: 'true' | 'false';
  preview?: 'true' | 'false';
  platform?: Platform;
  code?: string;
  name?: string;
  description?: string;
  dependencies?: string;
  sdkVersion?: SDKVersion;
  appetizePayerCode?: string;
  iframeId?: string;
  waitForData?: 'boolean';
  theme?: ThemeName;
};

export type SaveStatus = 'changed' | 'saving-draft' | 'saved-draft' | 'publishing' | 'published';

export type SaveHistory = Array<{
  id: string;
  savedAt: string;
  isDraft?: boolean;
}>;

export type $SetComplement<A, A1 extends A> = A extends A1 ? never : A;

export type $Subtract<T extends T1, T1 extends object> = Pick<T, $SetComplement<keyof T, keyof T1>>;
