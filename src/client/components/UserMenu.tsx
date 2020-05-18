import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import Avatar from './shared/Avatar';
import ContextMenu from './shared/ContextMenu';
import withAuth, { AuthProps } from '../auth/withAuth';

type State = {
  visible: boolean;
};

type Props = AuthProps & {
  onLogInClick: () => void;
};

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
      if (
        this._menu.current &&
        e.target !== this._menu.current &&
        !this._menu.current.contains(e.target as HTMLElement)
      ) {
        this._hideMenu();
      }
    } else if (
      this._avatar.current &&
      (e.target === this._avatar.current || this._avatar.current.contains(e.target as Node))
    ) {
      this.setState(state => ({ visible: !state.visible }));
    }
  };

  _handleDocumentContextMenu = () => {
    if (this.state.visible) {
      this._hideMenu();
    }
  };

  _hideMenu = () => this.setState({ visible: false });

  _menu = React.createRef<HTMLUListElement>();
  _avatar = React.createRef<HTMLButtonElement>();

  render() {
    const { viewer, logout } = this.props;

    return (
      <div className={css(styles.container)}>
        <button ref={this._avatar} className={css(styles.button)}>
          <Avatar source={viewer && viewer.picture ? viewer.picture : null} size={26} />
        </button>
        <ContextMenu
          ref={this._menu}
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
    marginRight: 16,
  },
  menu: {
    position: 'absolute',
    margin: '4px 0',
    right: 16,
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
