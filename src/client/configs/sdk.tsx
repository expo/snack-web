export const versions = {
  '33.0.0': true,
  '34.0.0': true,
};

export const DEFAULT_SDK_VERSION = '34.0.0';
export const FALLBACK_SDK_VERSION = '34.0.0';
export const TEST_SDK_VERSION = '34.0.0'

export type SDKVersion = keyof typeof versions;
