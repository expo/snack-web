import { Error as DeviceError } from '../utils/convertErrorToAnnotation';
import { SDKVersion } from '../configs/sdk';
import {
  FileSystemEntry,
  TextFileEntry,
  AssetFileEntry,
  SaveStatus,
  SaveHistory,
  Snack,
  QueryParams,
  Platform,
} from '../types';

export type Device = {
  name: string;
  id: string;
  platform: Platform;
};

export type DeviceLog = {
  device: Device;
  method: 'log' | 'error' | 'warn';
  payload: Array<unknown>;
};

export type EditorViewProps = {
  snack?: Snack;
  createdAt: string | undefined;
  saveHistory: SaveHistory;
  saveStatus: SaveStatus;
  creatorUsername?: string;
  fileEntries: FileSystemEntry[];
  entry: TextFileEntry | AssetFileEntry | undefined;
  name: string;
  description: string;
  dependencies: {
    [name: string]: {
      version: string;
    };
  };
  params: {
    id?: string;
    platform?: Platform;
  };
  channel: string;
  isResolving: boolean;
  loadingMessage: string | undefined;
  sessionID: string | undefined;
  connectedDevices: Device[];
  deviceError: DeviceError | undefined;
  deviceLogs: DeviceLog[];
  dependencyQueryParam: string | undefined;
  initialSdkVersion: SDKVersion;
  sdkVersion: SDKVersion;
  sendCodeOnChangeEnabled: boolean;
  onSendCode: () => void;
  onReloadSnack: () => void;
  onToggleSendCode: () => void;
  onClearDeviceLogs: () => void;
  onFileEntriesChange: (entries: FileSystemEntry[]) => Promise<void>;
  onChangeCode: (code: string) => void;
  onSubmitMetadata: (
    details: {
      name: string;
      description: string;
    },
    draft?: boolean
  ) => Promise<void>;
  onChangeSDKVersion: (sdkVersion: SDKVersion) => void;
  onPublishAsync: (options: { allowedOnProfile?: boolean }) => Promise<void>;
  onDownloadAsync: () => Promise<void>;
  onSignIn: () => Promise<void>;
  uploadFileAsync: (file: File) => Promise<string>;
  syncDependenciesAsync: (
    modules: {
      [name: string]: string | undefined;
    },
    onError: (name: string, e: Error) => void
  ) => Promise<void>;
  setDeviceId: (deviceId: string) => void;
  deviceId: string | undefined;
  wasUpgraded: boolean;
  autosaveEnabled: boolean;
  query: QueryParams;
  userAgent: string;
  previewRef: React.MutableRefObject<Window | null>;
};
