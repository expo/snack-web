/* @flow */

import Qs from 'qs';
import constructExperienceURL from './constructExperienceURL';
import constants from '../configs/constants';
import type { SDKVersion } from '../configs/sdk';

type Props = {
  sdkVersion: SDKVersion,
  channel: string,
  platform: 'ios' | 'android',
  previewQueue: 'main' | 'secondary',
  snackId?: ?string,
  autoplay?: boolean,
  screenOnly?: boolean,
  scale?: number,
  payerCode?: string,
  host?: string,
};

export default function appetizeUrlFor({
  sdkVersion,
  channel,
  snackId,
  platform,
  screenOnly = false,
  scale,
  autoplay,
  payerCode,
  previewQueue,
  host,
}: Props) {
  const experienceURL = constructExperienceURL({
    sdkVersion,
    channel,
    snackId,
    host,
  });

  let appetizeOptions = {
    screenOnly,
    scale,
    autoplay: !!autoplay,
    embed: true,
    device: platform === 'ios' ? 'iphone5' : 'nexus5',
    launchUrl: platform === 'android' ? experienceURL : undefined,
    xdocMsg: true,
    deviceColor: 'black',
    xDocMsg: true,
    orientation: 'portrait',
    debug: true,
    pc: payerCode,
  };

  const appetizeKey = constants.appetize.public_keys[previewQueue][platform];
  const appParams = {
    EXKernelLaunchUrlDefaultsKey: experienceURL,
    EXKernelDisableNuxDefaultsKey: true,
  };

  return `${constants.appetize.url}/embed/${appetizeKey}?${Qs.stringify(
    appetizeOptions
  )}&params=${encodeURIComponent(JSON.stringify(appParams))}`;
}
