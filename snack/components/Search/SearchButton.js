/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import Button from '../shared/Button';
import LazyLoad from '../shared/LazyLoad';
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
    // data-test-id is used to identify the element in integration tests
    const searchButton = (
      // $FlowIgnore
      <Button
        icon={require('../../assets/search.svg')}
        onClick={this._handleClick}
        data-test-id="search-button">
        Search
      </Button>
    );

    return (
      <React.Fragment>
        {searchButton}
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
