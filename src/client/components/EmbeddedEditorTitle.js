/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import Popover from './shared/Popover';
import getSnackURLFromEmbed from '../utils/getSnackURLFromEmbed';
import withThemeName, { type ThemeName } from './Preferences/withThemeName';

type Props = {|
  name: string,
  description: string,
  sessionID?: string,
  onOpenFullview?: () => void,
  theme: ThemeName,
|};

type State = {|
  popoverVisible: boolean,
|};

const ExternalLink = ({ sessionID, onOpenFullview, theme }) => {
  const url = getSnackURLFromEmbed(sessionID);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={css(styles.icon, theme === 'light' ? styles.externalLight : styles.externalDark)}
      onClick={onOpenFullview}
    />
  );
};

class EmbeddedEditorTitle extends React.PureComponent<Props, State> {
  state = {
    popoverVisible: false,
  };

  componentDidMount() {
    document.addEventListener('click', this._handleDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocumentClick);
  }

  _handleDocumentClick = (e: any) => {
    if (
      this.state.popoverVisible &&
      (e.target === this._info ||
        e.target === this._popover ||
        (this._popover && this._popover.contains(e.target)))
    ) {
      return;
    }

    this._hidePopover();
  };

  _togglePopover = () => this.setState(state => ({ popoverVisible: !state.popoverVisible }));

  _hidePopover = () => this.setState({ popoverVisible: false });

  _info: any;
  _popover: any;

  render() {
    const { name, sessionID, onOpenFullview, theme } = this.props;

    return (
      <div className={css(styles.header)}>
        <h1 className={css(styles.title)}>{name}</h1>
        <div className={css(styles.iconContainer)}>
          <Popover content={<p className={css(styles.description)}>description</p>}>
            <button
              className={css(styles.icon, theme === 'light' ? styles.infoLight : styles.infoDark)}
            />
          </Popover>
          {sessionID ? (
            <ExternalLink theme={theme} sessionID={sessionID} onOpenFullview={onOpenFullview} />
          ) : null}
        </div>
      </div>
    );
  }
}

export default withThemeName(EmbeddedEditorTitle);

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    margin: '.25em .75em',
    backgroundColor: 'inherit',
  },

  title: {
    lineHeight: 1,
    fontSize: '1.2em',
    fontWeight: 500,
    margin: 0,
  },

  iconContainer: {
    display: 'flex',
    flexDirection: 'row',
    margin: '0 .25em',
    backgroundColor: 'inherit',
  },

  icon: {
    height: 16,
    width: 16,
    margin: 8,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundColor: 'transparent',
    border: 0,
    outline: 0,
    opacity: 0.3,
    transition: '.2s',

    ':hover': {
      opacity: 0.8,
    },
  },

  description: {
    margin: 16,
  },

  infoLight: {
    backgroundImage: `url(${require('../assets/info-icon.png')})`,
  },

  infoDark: {
    backgroundImage: `url(${require('../assets/info-icon-light.png')})`,
  },

  externalLight: {
    backgroundImage: `url(${require('../assets/open-link-icon.png')})`,
  },

  externalDark: {
    backgroundImage: `url(${require('../assets/open-link-icon-light.png')})`,
  },
});
