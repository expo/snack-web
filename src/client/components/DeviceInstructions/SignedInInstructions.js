/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';


import type { Viewer } from '../../types';

type Props = {
  logout: () => mixed,
  viewer: Viewer,
};

export default function SignedInInstructions({ viewer, logout }: Props) {
  return (
    <React.Fragment>
      <p>
        Download the Expo app, sign in with your Expo account and open the project from the
        “Projects” tab.
      </p>
      <p>
        You are currently signed in to Snack as <strong>{viewer.username}</strong> (<a
          onClick={logout}
          className={css(styles.signOutLink)}>
          sign out
        </a>).
      </p>
      <div className={css(styles.previewContainer)}>
        <img
          className={css(styles.previewScreenshot)}
          src={require('../../assets/ios-instructions-preview.png')}
        />
      </div>
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  button: {
    display: 'block',
    width: 208,
    margin: '.5em auto',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '.5em center',
    '-webkit-font-smoothing': 'initial',
  },
  previewContainer: {
    marginBottom: '15px',
  },
  previewScreenshot: {
    height: '246px',
    width: '302px',
  },
  signOutLink: {
    cursor: 'pointer',
  },
});
