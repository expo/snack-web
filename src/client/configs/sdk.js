/* @flow */

export const versions = {
  '25.0.0': true,
  '26.0.0': true,
  '27.0.0': true,
  '28.0.0': true,
  '29.0.0': true,
  '30.0.0': true,
};

export const DEFAULT_SDK_VERSION = '30.0.0';
export const FALLBACK_SDK_VERSION = '25.0.0';

export type SDKVersion = $Keys<typeof versions>;
