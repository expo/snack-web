/* @flow */

import constructAppetizeURL from '../constructAppetizeURL';

it('constructs appetize URL', () => {
  expect(
    constructAppetizeURL({
      sdkVersion: '25.0.0',
      channel: '456a768',
      platform: 'ios',
      host: 'snack.expo.io',
      previewQueue: 'main',
    })
  ).toMatchSnapshot();
  expect(
    constructAppetizeURL({
      sdkVersion: '25.0.0',
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
