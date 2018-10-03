/* @flow */

import compareSDKVersion from '../compareSDKVersion';

it('compares sdk version', () => {
  expect(compareSDKVersion('25.0.0', '25.0.0')).toBe(0);
  expect(compareSDKVersion('26.0.0', '25.0.0')).toBe(1);
  expect(compareSDKVersion('24.0.0', '25.0.0')).toBe(-1);
});
