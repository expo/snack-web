import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import { SDKVersion } from '../../configs/sdk';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import ToggleButtons from '../shared/ToggleButtons';
import AppetizeFrame from './AppetizeFrame';
import WebFrame from './WebFrame';
import { Platform } from '../../types';
import FeatureFlags from '../../utils/FeatureFlags';

export const VISIBILITY_MEDIA_QUERY = '(min-width: 700px)';

type Props = {
  sdkVersion: SDKVersion;
  channel: string;
  platform: Platform;
  onChangePlatform: (platform: Platform) => void;
  canUserAuthenticate: boolean;
  wasUpgraded: boolean;
  previewQueue: 'main' | 'secondary';
  snackId?: string;
  className?: string;
  screenOnly?: boolean;
  payerCode?: string;
  onClickRunOnPhone: () => void;
  theme: ThemeName;
};

type State = {
  popupUrl?: string;
  isRendered: boolean;
  isPopupOpen: boolean;
};

class DevicePreview extends React.PureComponent<Props, State> {
  state: State = {
    isRendered: false,
    isPopupOpen: false,
  };

  componentDidMount() {
    this.mql = window.matchMedia(VISIBILITY_MEDIA_QUERY);
    this.mql.addListener(this.handleMediaQuery);
    this.handleMediaQuery(this.mql);
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (this.state.isPopupOpen && prevState.popupUrl !== this.state.popupUrl) {
      this.handlePopup();
    }
  }

  componentWillUnmount() {
    clearInterval(this.popupInterval);

    this.mql && this.mql.removeListener(this.handleMediaQuery);

    if (this.popup) {
      this.popup.close();
    }
  }

  private handleMediaQuery = (mql: any) =>
    this.setState({
      isRendered: mql.matches,
    });

  private handlePopup = () => {
    this.popup = window.open(this.state.popupUrl, 'snack-device', 'width=327,height=668');

    if (this.popup && this.popup.closed) {
      return;
    }

    this.setState({
      isPopupOpen: true,
    });

    clearInterval(this.popupInterval);

    this.popupInterval = setInterval(() => {
      if (!this.popup || this.popup.closed) {
        clearInterval(this.popupInterval);
        this.popup = null;
        this.setState({
          isPopupOpen: false,
        });
      }
    }, 500);
  };

  private handlePopupUrl = (url: string) => this.setState({ popupUrl: url });

  private popupInterval: any;
  private popup: Window | null = null;
  private mql: MediaQueryList | null = null;

  render() {
    const { isPopupOpen, isRendered } = this.state;

    if (!isRendered || isPopupOpen) {
      return null;
    }

    const {
      snackId,
      platform: currentPlatform,
      screenOnly,
      onChangePlatform,
      canUserAuthenticate,
      wasUpgraded,
      previewQueue,
      sdkVersion,
      channel,
      payerCode,
      onClickRunOnPhone,
      theme,
    } = this.props;

    const platform = FeatureFlags.isAvailable('PLATFORM_WEB', sdkVersion)
      ? currentPlatform
      : currentPlatform !== 'web'
      ? currentPlatform
      : 'android';

    return (
      <div
        className={classnames(
          css(screenOnly ? styles.centered : styles.container),
          this.props.className
        )}>
        {screenOnly ? null : (
          <div className={css(styles.header)}>
            {FeatureFlags.isAvailable('PLATFORM_WEB', sdkVersion) ? (
              <ToggleButtons
                options={[
                  { label: 'Android', value: 'android' },
                  { label: 'iOS', value: 'ios' },
                  { label: 'Web', value: 'web' },
                ]}
                value={platform}
                onValueChange={onChangePlatform}
                className={css(styles.toggleButtons)}
              />
            ) : (
              <ToggleButtons
                options={[{ label: 'Android', value: 'android' }, { label: 'iOS', value: 'ios' }]}
                value={platform}
                onValueChange={onChangePlatform}
                className={css(styles.toggleButtons)}
              />
            )}
            <button
              className={css(
                styles.popupButton,
                theme === 'dark' ? styles.popupButtonDark : styles.popupButtonLight
              )}
              onClick={this.handlePopup}
            />
          </div>
        )}
        {platform === 'web' ? (
          <WebFrame
            sdkVersion={sdkVersion}
            channel={channel}
            snackId={snackId}
            onPopupUrl={this.handlePopupUrl}
          />
        ) : (
          <AppetizeFrame
            sdkVersion={sdkVersion}
            channel={channel}
            platform={platform}
            canUserAuthenticate={canUserAuthenticate}
            wasUpgraded={wasUpgraded}
            previewQueue={previewQueue}
            snackId={snackId}
            screenOnly={screenOnly}
            payerCode={payerCode}
            isPopupOpen={isPopupOpen}
            onPopupUrl={this.handlePopupUrl}
            onClickRunOnPhone={onClickRunOnPhone}
          />
        )}
      </div>
    );
  }
}

export default withThemeName(DevicePreview);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    maxWidth: '50%',
    overflow: 'auto',
    display: 'none',
    flexDirection: 'column',

    [`@media ${VISIBILITY_MEDIA_QUERY}`]: {
      display: 'flex',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '8px 0',
  },
  toggleButtons: {
    zIndex: 3,
  },
  popupButton: {
    position: 'absolute',
    right: 0,
    zIndex: 2,
    appearance: 'none',
    height: 48,
    width: 48,
    padding: 16,
    margin: 0,
    border: 0,
    outline: 0,
    opacity: 0.8,
    backgroundSize: 16,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'transparent',
    transition: '.2s',

    ':hover': {
      opacity: 1,
    },
  },
  popupButtonDark: {
    backgroundImage: `url(${require('../../assets/open-link-icon-light.png')})`,
  },
  popupButtonLight: {
    backgroundImage: `url(${require('../../assets/open-link-icon.png')})`,
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
  },
});
