/* @flow */

import compareSDKVersion from '../utils/compareSDKVersion';
import type { SDKVersion } from '../configs/sdk';

type Flag = $Keys<typeof FLAGS>;

const FLAGS = {
  PROJECT_DEPENDENCIES: {
    sdk: '25.0.0',
    enabled: true,
  },
};
const isRequested = (name: Flag) => {
  return typeof window !== 'undefined'
    ? window.location.search
        .slice(1)
        .split('&')
        .includes(`flag_enable_${name.toLowerCase()}=true`)
    : false;
};

const FeatureFlags = {
  FLAGS,
  isAvailable(name: Flag, sdk: SDKVersion) {
    const config = FLAGS[name];
    const supported = config.sdk ? compareSDKVersion(sdk, config.sdk) !== -1 : true;

    if (supported) {
      if (config.enabled) {
        return true;
      }

      return isRequested(name);
    }

    return false;
  },
  isRequested,
};

export default FeatureFlags;
