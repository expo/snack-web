/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import ButtonLink from './ButtonLink';

import constructExperienceURL from '../../utils/constructExperienceURL';
import type { SDKVersion } from '../../configs/sdk';

type Props = {
  sdkVersion: SDKVersion,
  channel: string,
  snackId: ?string,
};

const OpenWithExpoButton = ({ sdkVersion, channel, snackId }: Props) => {
  const experienceURL = constructExperienceURL({
    sdkVersion,
    channel,
    snackId,
  });

  return (
    <ButtonLink
      variant="primary"
      target="_blank"
      href={experienceURL}
      className={css(styles.button)}>
      Open with Expo
    </ButtonLink>
  );
};

export default OpenWithExpoButton;

const styles = StyleSheet.create({
  button: {
    display: 'block',
  },
});
