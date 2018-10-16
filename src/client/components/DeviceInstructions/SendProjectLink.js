/* @flow */

import { StyleSheet, css } from 'aphrodite';

import * as React from 'react';

import LargeInput from '../shared/LargeInput';
import Button from '../shared/Button';
import * as Validations from '../../auth/validations';

type Props = {
  url: string,
};

type State = {
  value: string,
  status: 'saving' | 'saved' | null,
  error: ?string,
};

export default class SendProjectLink extends React.Component<Props, State> {
  state = {
    value: '',
    status: null,
    error: null,
  };

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  _isMounted: boolean;

  _handleChange = (e: *) => {
    this.setState({
      value: e.target.value,
      status: null,
      error: null,
    });
  };

  _handleSend = async (contact: string) => {
    if (this.state.status === 'saving') {
      return;
    }

    this.setState({ status: 'saving' });

    const baseUrl = '/--/api/send/';
    const urlToSend = this.props.url;
    const includeExponentLink = true;
    const args = [contact, urlToSend, includeExponentLink];
    const url = baseUrl + encodeURIComponent(JSON.stringify(args));

    try {
      await fetch(url);
    } catch (e) {
      throw new Error(Validations.messages.CANT_SEND_EMAIL_OR_TEXT);
    }
  };

  _handleSubmit = async (ev: *) => {
    ev.preventDefault();

    if (this.state.status === 'saved' || !this.state.value) {
      return;
    }

    try {
      await this._handleSend(this.state.value);

      this.setState({
        status: 'saved',
        value: '',
      });

      setTimeout(() => {
        if (this._isMounted) {
          this.setState({ status: null });
        }
      }, 1500);
    } catch (e) {
      this.setState({
        status: null,
        error: Validations.messages.CANT_SEND_EMAIL_OR_TEXT,
      });
    }
  };

  render() {
    return (
      <div>
        <p className={css(styles.paragraph)}>
          Send the project URL to your mobile device via e-mail or SMS. Your information will be
          immediately discarded.
        </p>

        <form onSubmit={this._handleSubmit} className={css(styles.formContainer)}>
          <LargeInput
            placeholder="Your phone number or email address"
            autoFocus
            disabled={this.state.status === 'saving'}
            value={this.state.value}
            onChange={this._handleChange}
          />
          <Button
            type="submit"
            variant="secondary"
            large
            loading={this.state.status === 'saving'}
            className={css(this.state.status === 'saved' && styles.sendButtonSent)}>
            {this.state.status === 'saving'
              ? 'Sending...'
              : this.state.status === 'saved' ? 'Sent' : 'Send'}
          </Button>
        </form>
        <p>{this.state.error}</p>
      </div>
    );
  }
}

const styles = StyleSheet.create({
  paragraph: {
    textAlign: 'center',
    marginTop: '5px',
    marginBottom: '14px',
  },
  sendButtonSent: {
    backgroundColor: 'green',
  },
  inputStart: {
    marginTop: '16px',
  },
  container: {
    width: '100%',
    padding: '8px',
    [`@media (max-width: 300px)`]: {
      padding: '16px',
    },
  },
  formContainer: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    flexDirection: 'column',
  },
  formContainerLeft: {
    minWidth: '25%',
    width: '100%',
  },
  formContainerRight: {
    paddingLeft: '16px',
    flexShrink: 0,
  },
});
