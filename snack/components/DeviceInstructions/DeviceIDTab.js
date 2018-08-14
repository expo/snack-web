/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import LargeInput from '../shared/LargeInput';
import Button from '../shared/Button';
import Banner from '../shared/Banner';


type Props = {
  deviceId: ?string,
  setDeviceId: (deviceId: string) => Promise<void>,
};

type State = {
  deviceId: string,
  status: 'loading' | 'success' | 'error' | null,
};

export default class DeviceIDTab extends React.Component<Props, State> {
  state = {
    deviceId: this.props.deviceId || '',
    status: null,
  };

  _handleChange = (e: *) =>
    this.setState({
      deviceId: e.target.value,
    });

  _handleSubmit = async (e: *) => {
    e.preventDefault();

    this.setState({ status: 'loading' });

    try {
      await this.props.setDeviceId(this.state.deviceId);

      this.setState({ status: 'success' });
    } catch (e) {
      this.setState({ status: 'error' });
    } finally {
      setTimeout(() => this.setState({ status: null }), 3000);
    }
  };

  render() {
    return (
      <React.Fragment>
        <form onSubmit={this._handleSubmit}>
          <h4 className={css(styles.title)}>Your Device ID</h4>
          <LargeInput
            autoFocus
            value={this.state.deviceId}
            type="text"
            onChange={this._handleChange}
            placeholder="XXXX-XXXX"
          />
          <Button large variant="secondary" type="submit" loading={this.state.status === 'loading'}>
            Save
          </Button>
        </form>
        <p>You can find the Device ID at the bottom of the "Projects" tab in the Expo app.</p>
        <img
          className={css(styles.screenshot)}
          src={require('../../assets/device-id-screenshot.png')}
        />
        <Banner type="success" visible={this.state.status === 'success'}>
          Check the "Recently in development" section in the "Projects" tab of the Expo app to find
          this Snack!
        </Banner>
        <Banner type="error" visible={this.state.status === 'error'}>
          An error occurred! Please try another method or try after sometime.
        </Banner>
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  screenshot: {
    height: 136,
    display: 'block',
    margin: '16px auto',
    borderRadius: 3,
    border: '1px solid rgba(0, 0, 0, .08)',
  },
  title: {
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
    lineHeight: '22px',
    margin: '16px 0 6px',
  },
});
