/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import Button from '../shared/Button';
import Banner from '../shared/Banner';
import LargeInput from '../shared/LargeInput';
import withAuth, { type AuthProps } from '../../auth/withAuth';
import colors from '../../configs/colors';

type Props = AuthProps & {|
  onSuccess?: () => Promise<void>,
  onError?: () => mixed,
|};

type State = {
  username: string,
  password: string,
  error: boolean,
  loading: boolean,
};

class AuthenticationForm extends React.Component<Props, State> {
  state = {
    username: '',
    password: '',
    error: false,
    loading: false,
  };

  _handleChange = (e: *) => {
    this.setState({
      [e.target.name]: e.target.value,
      error: false,
    });
  };

  _handleUserAuth = async (e: *) => {
    e.preventDefault();

    this.setState({ loading: true, error: false });

    const { success } = await this.props.login({
      username: this.state.username,
      password: this.state.password,
    });
    if (success) {
      this.props.onSuccess && this.props.onSuccess();
    } else {
      this.props.onError && this.props.onError();
    }

    this.setState({ loading: false, error: !success });
  };

  render() {
    return (
      <div>
        <form onSubmit={this._handleUserAuth}>
          <h4 className={css(styles.subtitle)}>Username</h4>
          <LargeInput
            value={this.state.username}
            name="username"
            autoFocus
            onChange={this._handleChange}
          />
          <h4 className={css(styles.subtitle)}>Password</h4>
          <LargeInput
            value={this.state.password}
            name="password"
            type="password"
            onChange={this._handleChange}
          />
          <div className={css(styles.buttons)}>
            <Button large variant="secondary" type="submit" loading={this.state.loading}>
              Log in
            </Button>
          </div>
          <p className={css(styles.caption)}>
            <a className={css(styles.link)} href="https://expo.io/signup" target="blank">
              Sign up for Expo
            </a>
          </p>
        </form>

        <Banner type="error" visible={this.state.error}>
          An error occurred while logging in to your account!
        </Banner>
      </div>
    );
  }
}

export default withAuth(AuthenticationForm);

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
    lineHeight: '22px',
    margin: '16px 0 6px 0',
  },
  buttons: {
    margin: '20px 0 0 0',
  },
  caption: {
    marginTop: 24,
    fontSize: '16px',
    lineHeight: '22px',
    textAlign: 'center',
  },
  link: {
    cursor: 'pointer',
    color: colors.primary,
    textDecoration: 'underline',
  },
});
