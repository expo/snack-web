/* @flow */

import * as React from 'react';
import ReactDOM from 'react-dom';
import { StyleSheet, css } from 'aphrodite';

import Avatar from './shared/Avatar';
import ContextMenu from './shared/ContextMenu';
import withAuth, { type AuthProps } from '../auth/withAuth';

type State = {
  visible: boolean,
};

type Props = AuthProps & {|
  onLogInClick: () => mixed,
|};

class UserMenu extends React.Component<Props, State> {
  state = {
    visible: false,
    isLoggingIn: false,
  };

  componentDidMount() {
    document.addEventListener('click', this._handleDocumentClick);
    document.addEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('contextmenu', this._handleDocumentContextMenu);
  }

  _handleDocumentClick = (e: MouseEvent) => {
    if (this.state.visible) {
      if (this._menu && e.target !== this._menu && !this._menu.contains(e.target)) {
        this._hideMenu();
      }
    } else if (this._avatar && (e.target === this._avatar || this._avatar.contains(e.target))) {
      this.setState(state => ({ visible: !state.visible }));
    }
  };

  _handleDocumentContextMenu = () => {
    if (this.state.visible) {
      this._hideMenu();
    }
  };

  _hideMenu = () => this.setState({ visible: false });

  _menu: any;
  _avatar: any;

  render() {
    const { viewer, logout } = this.props;

    return (
      <div className={css(styles.container)}>
        <button ref={c => (this._avatar = ReactDOM.findDOMNode(c))} className={css(styles.button)}>
          <Avatar
            source={viewer && viewer.picture ? viewer.picture : require('../assets/avatar.svg')}
            size={40}
          />
        </button>
        <ContextMenu
          ref={c => (this._menu = ReactDOM.findDOMNode(c))}
          visible={this.state.visible}
          actions={
            viewer
              ? [
                  {
                    label: 'View profile',
                    handler: () => window.open(`https://expo.io/@${viewer.username}/`),
                  },
                  {
                    label: 'View snacks',
                    handler: () => window.open(`https://expo.io/snacks/@${viewer.username}/`),
                  },
                  {
                    label: 'Edit account',
                    handler: () => window.open(`https://expo.io/settings/profile/`),
                  },
                  { label: 'Log out', handler: logout },
                ]
              : [
                  {
                    label: 'Log in',
                    handler: this.props.onLogInClick,
                  },
                ]
          }
          onHide={this._hideMenu}
          className={css(styles.menu)}
        />
      </div>
    );
  }
}

export default withAuth(UserMenu);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    margin: '0 16px 0 12px',
  },
  menu: {
    position: 'absolute',
    margin: '10px 0',
    right: 0,
    top: '100%',
  },
  button: {
    appearance: 'none',
    background: 'transparent',
    padding: 0,
    margin: 0,
    border: 0,
    outline: 0,
  },
});
