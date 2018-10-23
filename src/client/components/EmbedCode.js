/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import CopyToClipboard from 'react-copy-to-clipboard';

import Banner from './shared/Banner';
import Button from './shared/Button';
import ToggleSwitch from './shared/ToggleSwitch';
import ToggleButtons from './shared/ToggleButtons';

import colors from '../configs/colors';
import constants from '../configs/constants';
import withThemeName, { type ThemeName } from './Preferences/withThemeName';

const handleClick = (e: *) => e.target.select();

type Props = {|
  params?: {
    id?: string,
  },
  theme: ThemeName,
|};

type State = {|
  platform: 'ios' | 'android',
  preview: boolean,
  theme: 'light' | 'dark',
  copied: boolean,
|};

class EmbedCode extends React.PureComponent<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      platform: 'ios',
      preview: true,
      theme: this.props.theme || 'light',
      copied: false,
    };
  }

  state: State;

  componentDidMount() {
    this._maybeInsertScript();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.preview !== this.state.preview ||
      prevState.platform !== this.state.platform ||
      prevState.theme !== this.state.theme
    ) {
      global.requestAnimationFrame(this._reinitialize);
    }
  }

  _reinitialize = () => {
    if ('ExpoSnack' in window) {
      const container = document.querySelector('[data-snack-id]');
      window.ExpoSnack.remove(container);
      window.ExpoSnack.append(container);
    }
  };

  _maybeInsertScript = () => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const url = `${protocol}//${host}/embed.js`;
    const scripts = document.querySelectorAll(`script[src="${url}"]`);

    if (scripts.length) {
      this._reinitialize();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.type = 'text/javascript';
    script.src = url;

    if (document.body) {
      document.body.appendChild(script);
    }
  };

  _handleCopy = () => {
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 1000);
  };

  _handleTogglePreview = () => this.setState(state => ({ preview: !state.preview }));

  _handleToggleTheme = () =>
    this.setState(state => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    }));

  _handleChangePlatform = platform => this.setState({ platform });

  render() {
    const { platform, preview, theme, copied } = this.state;

    const protocol = window.location.protocol;
    const host = window.location.host;

    const html = `<div data-snack-id="${(this.props.params && this.props.params.id) ||
      ''}" data-snack-platform="${platform}" data-snack-preview="${String(
      preview
    )}" data-snack-theme="${theme}" style="overflow:hidden;background:${theme === 'light'
      ? colors.background.light
      : colors.background
          .dark};border:1px solid rgba(0,0,0,.08);border-radius:4px;height:505px;width:100%"></div>`;
    const code = `${html}\n<script async src="${protocol}//${host}/embed.js"></script>`;

    return (
      <div className={css(styles.container)}>
        <Banner visible={copied}>Copied to clipboard!</Banner>
        <div className={css(styles.section)}>
          <h3 className={css(styles.header)}>Embed Preview</h3>
          <div className={css(styles.row, styles.options)}>
            <ToggleButtons
              light={this.props.theme !== 'light'}
              options={[{ label: 'iOS', value: 'ios' }, { label: 'Android', value: 'android' }]}
              value={platform}
              onValueChange={this._handleChangePlatform}
              label="Platform"
              className={css(styles.last)}
            />
            <ToggleSwitch
              light={this.props.theme !== 'light'}
              checked={preview}
              label="Device Preview"
              onChange={this._handleTogglePreview}
            />
            <ToggleSwitch
              light={this.props.theme !== 'light'}
              checked={theme !== 'light'}
              label="Dark theme"
              onChange={this._handleToggleTheme}
            />
          </div>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <div className={css(styles.section)}>
          <h3 className={css(styles.header)}>Embed Code</h3>
          <div className={css(styles.inputContainer)}>
            <input
              readOnly
              className={css(
                styles.code,
                this.props.theme === 'light' ? styles.inputLight : styles.inputDark
              )}
              onClick={handleClick}
              value={code}
            />
            <CopyToClipboard text={code} onCopy={this._handleCopy}>
              <Button variant="primary" className={css(styles.copyButton)}>
                Copy to clipboard
              </Button>
            </CopyToClipboard>
          </div>
        </div>
      </div>
    );
  }
}

export default withThemeName(EmbedCode);

const styles = StyleSheet.create({
  container: {
    width: 780,
    textAlign: 'left',
  },
  header: {
    margin: '.5em 0',
    fontWeight: 500,
  },
  options: {
    color: '#999',
    margin: '0 0 .5em -1em',
  },
  last: {
    marginRight: 0,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    ':not(:last-of-type)': {
      paddingBottom: '1.5em',
    },
  },
  code: {
    fontFamily: 'var(--font-monospace)',
    padding: '1em',
    width: '100%',
    outline: 0,
    border: `1px solid ${colors.border}`,
    borderRadius: 3,
  },
  inputLight: {
    backgroundColor: colors.background.light,
    color: colors.text.light,
  },
  inputDark: {
    backgroundColor: 'rgba(0, 0, 0, .2)',
    color: colors.text.dark,
  },
  inputContainer: {
    position: 'relative',
  },
  copyButton: {
    position: 'absolute',
    right: 0,
  },
});
