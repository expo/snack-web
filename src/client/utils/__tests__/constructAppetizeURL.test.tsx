import { TEST_SDK_VERSION } from '../../configs/sdk';
import constructAppetizeURL from '../constructAppetizeURL';

it('constructs appetize URL', () => {
  expect(
    constructAppetizeURL({
      sdkVersion: TEST_SDK_VERSION,
      channel: '456a768',
      platform: 'ios',
      host: 'snack.expo.io',
      previewQueue: 'main',
    })
  ).toMatchSnapshot();
  expect(
    constructAppetizeURL({
      sdkVersion: TEST_SDK_VERSION,
      channel: '456a768',
      platform: 'android',
      autoplay: true,
      screenOnly: true,
      scale: 2,
      payerCode: 'asdf',
      host: 'snack.expo.io',
      previewQueue: 'secondary',
    })
  ).toMatchSnapshot();
});
