import compareSDKVersion from '../utils/compareSDKVersion';
import { SDKVersion } from '../configs/sdk';

type Flag = keyof typeof FLAGS;

const FLAGS = {
  // Whether third-party dependencies are supported
  // Keep this to support upgrading snacks with older versions
  PROJECT_DEPENDENCIES: {
    sdk: '25.0.0',
    enabled: true,
  },
  // Whether App.tsx and App.ts are supported as entry files
  TYPESCRIPT: {
    sdk: '31.0.0',
    enabled: true,
  },
  // Whether it's possible to reload the snack on the app
  RELOAD_SNACK: {
    sdk: '32.0.0',
    enabled: true,
  },
  // Whether snacks can run on web
  PLATFORM_WEB: {
    sdk: '33.0.0',
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
