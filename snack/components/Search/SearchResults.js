/* @flow */

import * as React from 'react';
import { request } from 'graphql-request';
import debounce from 'lodash/debounce';
import nullthrows from 'nullthrows';
import { StyleSheet, css } from 'aphrodite';
import { AutoSizer, List, InfiniteLoader } from 'react-virtualized';
import ProgressIndicator from '../shared/ProgressIndicator';
import SearchPlaceholder from './SearchPlaceholder';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import Segment from '../../utils/Segment';

const gql: any = String.raw;

const ENDPOINT = `${nullthrows(process.env.API_SERVER_URL)}/--/graphql`;

const SEARCH_SNACKS = gql`
  query($query: String!, $offset: Int!, $limit: Int!) {
    search(type: SNACKS, query: $query, offset: $offset, limit: $limit) {
      __typename
      ... on SnackSearchResult {
        id
        snack {
          slug
          name
          description
        }
      }
    }
  }
`;

type Snack = {
  slug: string,
  name: string,
  description: string,
};

type Props = {
  query: string,
  theme: ThemeName,
};

type State = {
  status:
    | { type: 'loading', data: Array<{ id: string, snack: Snack }> }
    | { type: 'success', data: Array<{ id: string, snack: Snack }> }
    | { type: 'failure', error: Error },
};

const PAGE_SIZE = 30;

class SearchResults extends React.Component<Props, State> {
  state = {
    status: { type: 'success', data: [] },
  };

  componentDidMount() {
    Segment.getInstance().startTimer('launchedSearch');
    Segment.getInstance().logEvent('SEARCH_OPENED');

    if (this.props.query) {
      this._fetchResultsNotDebounced(this.props.query);
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.query !== prevProps.query) {
      this._fetchResults(this.props.query);
    }
  }

  _handleClick = () =>
    Segment.getInstance().logEvent(
      'SEARCH_RESULT_CHOSEN',
      { searchTerm: this.props.query },
      'launchedSearch'
    );

  _fetchResultsNotDebounced = async (query, previous? = []) => {
    Segment.getInstance().logEvent('SEARCH_REQUESTED', { searchTerm: query });

    this.setState(({ status }) => ({
      status: {
        type: 'loading',
        data: previous,
      },
    }));

    try {
      const results = await request(ENDPOINT, SEARCH_SNACKS, {
        query: this.props.query,
        offset: previous.length,
        limit: PAGE_SIZE,
      });

      this.setState(({ status }) => ({
        status: {
          type: 'success',
          data: [...previous, ...results.search],
        },
      }));
    } catch (error) {
      console.error('Error fetching search results', error);

      this.setState({
        status: { type: 'failure', error },
      });
    }
  };

  _fetchResults = debounce(this._fetchResultsNotDebounced, 1000);

  _fetchMore = () => {
    const { status } = this.state;

    this._fetchResultsNotDebounced(this.props.query, status.type === 'success' ? status.data : []);
  };

  _renderRow = ({
    data: { id, snack },
    style,
    key,
  }: {
    data: { id: string, snack: Snack },
    style: Object,
    key: string,
  }) => (
    <div key={key} style={style}>
      <a
        target="_blank"
        href={`/${snack.slug}`}
        onClick={this._handleClick}
        className={css(styles.item, this.props.theme === 'dark' ? styles.dark : styles.light)}>
        <img
          className={css(styles.icon)}
          src={
            this.props.theme === 'dark'
              ? require('../../assets/snack-icon-dark.svg')
              : require('../../assets/snack-icon-color.svg')
          }
        />
        <div className={css(styles.content)}>
          <h4 className={css(styles.title)}>{snack.name}</h4>
          <p className={css(styles.description)}>{snack.description}</p>
        </div>
      </a>
    </div>
  );

  render() {
    const { status } = this.state;

    if (!this.props.query) {
      return <SearchPlaceholder label="Results will appear here." />;
    }

    if (status.type === 'failure') {
      return <SearchPlaceholder label="An error ocurred. Try again after some time." />;
    }

    if (status.type === 'loading' && !(status.data && status.data.length)) {
      return (
        <div className={css(styles.loadingContainer)}>
          <ProgressIndicator />
          <SearchPlaceholder label="Searching…" />
        </div>
      );
    }

    if (status.type === 'success' && !(status.data && status.data.length)) {
      return <SearchPlaceholder label="No results found." />;
    }

    return (
      <div className={css(status.type === 'loading' ? styles.loadingContainer : styles.container)}>
        {status.type === 'loading' ? <ProgressIndicator /> : null}
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              isRowLoaded={({ index }) => index < status.data.length}
              loadMoreRows={this._fetchMore}
              rowCount={status.data.length + 1}>
              {({ onRowsRendered, registerChild }) => (
                <List
                  ref={registerChild}
                  onRowsRendered={onRowsRendered}
                  height={height}
                  width={width}
                  rowCount={status.data.length}
                  rowHeight={72}
                  rowRenderer={({ index, style, key }) =>
                    this._renderRow({ data: status.data[index], style, key })}
                />
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>
    );
  }
}

export default withThemeName(SearchResults);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    display: 'flex',
    flex: 1,
  },

  icon: {
    display: 'block',
    height: 36,
    width: 36,
    marginTop: 4,
  },

  item: {
    height: 72,
    display: 'flex',
    padding: '16px 24px',
    cursor: 'pointer',
    boxShadow: '0 1px 0 rgba(36, 44, 58, 0.05)',
    color: 'inherit',
    textDecoration: 'none',
  },

  light: {
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, .08)',
    },
  },

  dark: {
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, .08)',
    },
  },

  content: {
    marginLeft: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 4,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },

  description: {
    fontSize: 14,
    margin: 0,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
});
