/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import LazyLoad from '../shared/LazyLoad';
import IconButton from '../shared/IconButton';
import ModalSheet from '../shared/ModalSheet';
import ProgressIndicator from '../shared/ProgressIndicator';
import SearchPlaceholder from './SearchPlaceholder';
import colors from '../../configs/colors';

type State = {
  query: string,
  focused: boolean,
};

export default class Searchbar extends React.Component<{}, State> {
  state = {
    query: '',
    focused: false,
  };

  _handleChange = (e: *) =>
    this.setState({
      query: e.target.value,
    });

  _handleClick = () => {
    this.setState({
      query: '',
      focused: true,
    });
  };

  _handleDismiss = () =>
    this.setState({
      query: '',
      focused: false,
    });

  render() {
    return (
      <React.Fragment>
        <IconButton
          title="Search for Snacks"
          label="Search"
          onClick={this._handleClick}
          data-test-id="search-button">
          <svg width="18px" height="18px" viewBox="0 0 18 18">
            <g transform="translate(-88.000000, -9.000000)" fillRule="evenodd">
              <path
                transform="translate(88.000000, 9.000000)"
                d="M13.1484375,10.96875 C13.8515625,9.8625 14.2640625,8.55 14.2640625,7.1390625 C14.2640625,3.196875 11.071875,0 7.134375,0 C3.1921875,0 0,3.196875 0,7.1390625 C0,11.08125 3.1921875,14.278125 7.1296875,14.278125 C8.559375,14.278125 9.890625,13.85625 11.00625,13.134375 L11.3296875,12.909375 L16.4203125,18 L18,16.3921875 L12.9140625,11.3015625 L13.1484375,10.96875 L13.1484375,10.96875 Z M11.128125,3.15 C12.1921875,4.2140625 12.778125,5.6296875 12.778125,7.134375 C12.778125,8.6390625 12.1921875,10.0546875 11.128125,11.11875 C10.0640625,12.1828125 8.6484375,12.76875 7.14375,12.76875 C5.6390625,12.76875 4.2234375,12.1828125 3.159375,11.11875 C2.0953125,10.0546875 1.509375,8.6390625 1.509375,7.134375 C1.509375,5.6296875 2.0953125,4.2140625 3.159375,3.15 C4.2234375,2.0859375 5.6390625,1.5 7.14375,1.5 C8.6484375,1.5 10.0640625,2.0859375 11.128125,3.15 L11.128125,3.15 Z"
              />
            </g>
          </svg>
        </IconButton>
        <ModalSheet
          className={css(styles.modal)}
          autoSize={false}
          visible={this.state.focused}
          onDismiss={this._handleDismiss}>
          <input
            type="search"
            autoFocus
            onChange={this._handleChange}
            placeholder="Search for Snacks…"
            className={css(styles.input)}
            data-test-id="search-input"
          />
          <div className={css(styles.results)}>
            <LazyLoad load={() => import('./SearchResults')}>
              {({ loaded, data: SearchResults }) => {
                if (loaded) {
                  return <SearchResults query={this.state.query} />;
                }

                return (
                  <div className={css(styles.loadingContainer)}>
                    {this.state.query ? <ProgressIndicator /> : null}
                    <SearchPlaceholder
                      label={this.state.query ? 'Searching…' : 'Results will appear here.'}
                    />
                  </div>
                );
              }}
            </LazyLoad>
          </div>
        </ModalSheet>
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    appearance: 'none',
    fontSize: 16,
    padding: '16px 24px 16px 56px',
    borderWidth: '0 0 1px 0',
    borderColor: colors.border,
    backgroundColor: 'transparent',
    backgroundImage: `url(${require('../../assets/search.svg')})`,
    backgroundSize: 16,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '24px center',
    transition: '150ms',

    ':focus': {
      outline: 0,
    },
  },

  modal: {
    display: 'flex',
    flexDirection: 'column',
    width: 640,
    height: 480,
    maxWidth: 'calc(100vw - 160px)',
    maxHeight: 'calc(100vh - 160px)',
  },

  results: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    textAlign: 'left',
  },

  loadingContainer: {
    display: 'flex',
    flex: 1,
  },
});
