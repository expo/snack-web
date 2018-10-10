/* @flow */

import * as React from 'react';

type Props = {
  className?: string,
};

export default function WhyNoQrBanner({ className }: Props) {
  return (
    <p className={className}>
      * As of March 29, 2018 , the Expo client on iOS can no longer scan QR codes.{' '}
      <a
        href="https://blog.expo.io/upcoming-limitations-to-ios-expo-client-8076d01aee1a"
        target="_blank">
        Read more.
      </a>
    </p>
  );
}
