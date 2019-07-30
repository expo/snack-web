import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import constructExperienceURL from '../../utils/constructExperienceURL';
import { SDKVersion } from '../../configs/sdk';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';

type Props = {
  sdkVersion: SDKVersion;
  channel: string;
  snackId?: string;
  onPopupUrl: (url: string) => void;
};

const S3_REGION = 'us-west-1';
const S3_BUCKET =
  process.env.NODE_ENV === 'production' && process.env.CONFIGURATOR_ENV === 'production'
    ? 'snack-web-player'
    : 'snack-web-player-staging';

function WebFrame({ sdkVersion, channel, snackId, onPopupUrl, theme }: Props) {
  const experienceUrl = constructExperienceURL({
    sdkVersion,
    channel,
    snackId,
  });

  const url = `https://s3.${S3_REGION}.amazonaws.com/${S3_BUCKET}/${
    sdkVersion.split('.')[0]
  }/index.html?initialUrl=${encodeURIComponent(experienceUrl)}`;

  React.useEffect(() => onPopupUrl(url), [url]);

  return (
    <div className={css(styles.pane)}>
      <iframe
        src={url}
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
