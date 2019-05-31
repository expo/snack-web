import { TEST_SDK_VERSION } from '../../configs/sdk';
import constructExperienceURL from '../constructExperienceURL';

it('constructs experience URL', () => {
  expect(
    constructExperienceURL({
      sdkVersion: TEST_SDK_VERSION,
      snackId: 'cdef5abc',
      channel: '456a768',
      host: 'snack.expo.io',
    })
  ).toBe('exp://expo.io/@snack/cdef5abc+456a768');
  expect(
    constructExperienceURL({
      sdkVersion: TEST_SDK_VERSION,
      snackId: 'cdef5abc',
      channel: '456a768',
      host: 'snack.expo.test',
    })
  ).toBe('exp://snack.ngrok.io/@snack/cdef5abc+456a768');
});
