import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import constructExperienceURL from '../../utils/constructExperienceURL';
import { SDKVersion } from '../../configs/sdk';

type Props = {
  previewRef: React.MutableRefObject<Window | null>;
  sdkVersion: SDKVersion;
  channel: string;
  theme: ThemeName;
  snackId?: string;
  onPopupUrl: (url: string) => void;
};

const S3_REGION = 'us-west-1';
const S3_BUCKET =
  process.env.NODE_ENV === 'production' && process.env.IMPORT_SERVER_URL === 'https://snackager.expo.io'
    ? 'snack-web-player'
    : 'snack-web-player-staging';

function WebFrame({ previewRef, sdkVersion, channel, snackId, onPopupUrl, theme }: Props) {
  const experienceUrl = constructExperienceURL({
    sdkVersion,
    channel,
    snackId,
  });

  const url = `${
    process.env.SNACK_APP_URL
      ? // Use proxied snack app when the URL is specified
        // Useful for testing the snack web player locally
        `/web-player`
      : `https://s3.${S3_REGION}.amazonaws.com/${S3_BUCKET}/${sdkVersion.split('.')[0]}`
  }/index.html?initialUrl=${encodeURIComponent(experienceUrl)}`;

  React.useEffect(() => onPopupUrl(url), [url]);

  return (
    <div className={css(styles.pane)}>
      <iframe
        ref={c => (previewRef.current = c ? c.contentWindow : null)}
        src={url}
        allow="geolocation; camera; microphone"
        className={css(styles.frame, theme === 'dark' ? styles.frameDark : styles.frameLight)}
      />
    </div>
  );
}

export default withThemeName(WebFrame);

const styles = StyleSheet.create({
  pane: {
    position: 'relative',
    display: 'flex',
    flex: 1,
    width: 324,
    height: '100%',
  },
  frame: {
    position: 'relative',
    width: '100%',
    height: '100%',
    border: 0,
    zIndex: 1,
  },
  frameLight: {
    backgroundColor: '#fefefe',
  },
  frameDark: {
    backgroundColor: '#ffffff',
  },
  spinnerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
