declare module 'snack-sdk' {
  import { SDKVersion } from '../src/client/configs/sdk';
  import { ExpoSnackFiles } from '../src/client/types';

  export type SnackSessionOptions = {
    files: ExpoSnackFiles;
    sdkVersion?: SDKVersion;
    verbose?: boolean;
    sessionId?: string;
    host?: string;
    sessionSecret?: string;
    snackId?: string;
    name?: string;
    description?: string;
    dependencies?: { [key: string]: { version: string } };
    authorizationToken?: string;
    disableDevSession?: boolean;
    user: { idToken?: string | null; sessionSecret?: string | null };
    deviceId?: string | null;
  };

  export class SnackSession {
    constructor(options: SnackSessionOptions);
  }

  export function isModulePreloaded(name: string, sdkVersion: SDKVersion): boolean;

  export const preloadedModules: {
    haste: string[];
    dependencies: {
      [key: SDKVersion]: {
        [key: string]: string;
      };
    };
  };
}
