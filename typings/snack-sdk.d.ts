declare module 'snack-sdk' {
  export type SDKVersion =
    | '31.0.0'
    | '32.0.0'
    | '33.0.0'
    | '34.0.0';

  export type SnackSessionOptions = {
    files: {
      [x: string]: {
        contents: string;
        type: 'ASSET' | 'CODE';
      };
    };
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
      [key in SDKVersion]: {
        [key: string]: string;
      };
    };
  };
}
