import { Platform } from '../types';
import FeatureFlags from './FeatureFlags';
import { SDKVersion } from '../configs/sdk';

export type PlatformOption = {
  label: string;
  value: Platform;
};

export function all(): PlatformOption[] {
  return [
    { label: 'iOS', value: 'ios' },
    { label: 'Android', value: 'android' },
    { label: 'Web', value: 'web' },
  ];
}

export function filter(params: {
  sdkVersion: SDKVersion;
  supportedPlatformsQueryParam: string | undefined;
}): PlatformOption[] {
  let defaultPlatformOptions: PlatformOption[] = all();
  if (!FeatureFlags.isAvailable('PLATFORM_WEB', params.sdkVersion)) {
    defaultPlatformOptions = defaultPlatformOptions.filter(option => option.value !== 'web');
  }

  if (params.supportedPlatformsQueryParam) {
    let parsedSupportedPlatformsQueryParam = params.supportedPlatformsQueryParam.split(',');
    let supportedPlatforms = defaultPlatformOptions.filter(option =>
      parsedSupportedPlatformsQueryParam.includes(option.value)
    );

    // If none of the provided platforms are valid, fallback to supporting all platforms.
    if (supportedPlatforms.length) {
      return supportedPlatforms;
    }
  }

  return defaultPlatformOptions;
}

export function getSelectedPlatform(params: {
  devicePreviewPlatform: Platform;
  sdkVersion: SDKVersion;
  options: PlatformOption[];
}): Platform {
  const { devicePreviewPlatform, sdkVersion, options } = params;

  let selectedPlatform: Platform = devicePreviewPlatform;

  // If we don't support web yet, default to Android
  if (selectedPlatform === 'web' && !FeatureFlags.isAvailable('PLATFORM_WEB', sdkVersion)) {
    selectedPlatform = 'android';
  }

  // If the selected platform is not enabled for this Snack then fallback to
  // the first available platform
  if (!options.find(platformOption => platformOption.value === selectedPlatform)) {
    selectedPlatform = options[0].value;
  }

  return selectedPlatform;
}