/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import querystring from 'query-string';

import withThemeName, { type ThemeName } from './Preferences/withThemeName';

type Props = {
  name: ?string,
  description: ?string,
  theme: ThemeName,
};

type State = {
  status:
    | 'idle' // import is waiting for an action
    | 'importing' // importing most recent commit
    | 'error', // an error occurred during import
  description: ?string,
};

const TIMEOUT_MS = 45000;

export class EditorImportTitle extends React.PureComponent<Props, State> {
  state: State = {
    status: 'idle',
    description: this.props.description,
  };

  _handleClick = async () => {
    if (this.state.status === 'idle') {
      this._handleReimport();
    } else if (this.state.status === 'error') {
      this._handleDismissError();
    } else {
      
    }
  };

  _handleDismissError = () => {
    this.setState({
      status: 'idle',
      description: this.props.description,
    });
  };

  _handleReimport = async () => {
    this.setState({
      status: 'importing',
      description: 'Importing latest commit...',
    });

    // TODO: this parsing isn't necessarily sufficient, ideally someone with
    // more regex experience than me would look over this for holes. My worry
    // is that additional fields will require more complex regexes
    try {
      // If the import hangs we want to make sure to throw an error
      let hangTimer = setTimeout(() => {
        if (this.state.status === 'importing') {
          this.setState({
            status: 'error',
          });
        }
      }, TIMEOUT_MS);

      if (!process.env.IMPORT_SERVER_URL) {
        throw 'missing IMPORT_SERVER_URL';
      }
      const IMPORT_API_URL = `${process.env.IMPORT_SERVER_URL}/git`;

      // Takes an expo url of the form:
      // https://snack.expo.io/@git/[host]/[owner]/[repo]:[path]@[branch]
      // Turns it into: [host]/[owner]/[repo]:[path]@[branch]
      let data = window.location.href.split('/@git/')[1];
      // Then matches it into: [host]/[owner]/[repo] and prepends https
      let repo = `https://${data.match(/([\w,\-,\_,\.]+)\/([\w,\-,\_]+)\/([\w,\-,\_]+)/)[0]}`;

      // Generates git import parameters from data
      let params = {
        repo,
      };
      // Takes data of the form: [host]/[owner]/[repo]:[path]@[branch]
      // and extracts the path
      let subpath = data.match(/:([\w,\-,\_.\/]+)/);
      if (subpath) {
        subpath = subpath[0].slice(1);
        /* $FlowFixMe */
        params.subpath = subpath;
      }
      // Takes data of the form: [host]/[owner]/[repo]:[path]@[branch]
      // and extracts the branch
      let branch = data.match(/@([\w,\-,\_.\/]+)/);
      if (branch) {
        branch = branch[0].slice(1);
        /* $FlowFixMe */
        params.branch = branch;
      }

      let res = await fetch(`${IMPORT_API_URL}?${querystring.stringify(params)}`);
      clearTimeout(hangTimer);
      if (res.ok) {
        window.location.reload();
        this.setState({
          status: 'idle',
          description: this.props.description,
        });
      } else {
        throw await res.text();
      }
    } catch (error) {
      this.setState({
        status: 'error',
        description: 'There was an error updating your project',
      });
    }
  };

  render() {
    const { status, description } = this.state;
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.header)}>
          <div className={css(styles.titleContainer)}>
            <h1 className={css(styles.title)}>{this.props.name}</h1>
          </div>
          <p
            className={css(styles.description)}
            style={{ opacity: status !== 'error' ? 0.5 : 1.0 }}>
            <svg
              className={status !== 'importing' ? css(styles.reimportBtn) : css(styles.spinningBtn)}
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              onClick={this._handleClick}
              style={{ fill: status === 'error' ? 'red' : null }}>
              <path
                d={
                  status !== 'error'
                    ? // Circular Arrow
                      'M9 13.5c-2.49 0-4.5-2.01-4.5-4.5S6.51 4.5 9 4.5c1.24 0 2.36.52 3.17 1.33L10 8h5V3l-1.76 1.76C12.15 3.68 10.66 3 9 3 5.69 3 3.01 5.69 3.01 9S5.69 15 9 15c2.97 0 5.43-2.16 5.9-5h-1.52c-.46 2-2.24 3.5-4.38 3.5z'
                    : // Cancel cross TODO make this red
                      'M9 1C4.58 1 1 4.58 1 9s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm4 10.87L11.87 13 9 10.13 6.13 13 5 11.87 7.87 9 5 6.13 6.13 5 9 7.87 11.87 5 13 6.13 10.13 9 13 11.87z'
                }
              />
            </svg>
            <span className={status === 'error' ? css(styles.error) : null}>{description}</span>
          </p>
        </div>
      </div>
    );
  }
}

export default withThemeName(EditorImportTitle);

const rotation = {
  '0%': { transform: `rotate(0deg)` },
  '100%': { transform: `rotate(360deg)` },
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    margin: '0 1em',
    padding: '.25em 0',
  },

  header: {
    display: 'block',
    appearance: 'none',
    backgroundColor: 'transparent',
    outline: 0,
    padding: 0,
    margin: 0,
    border: 0,
    minWidth: 0,
    textAlign: 'left',
    whiteSpace: 'nowrap',

    '@media (max-width: 480px)': {
      whiteSpace: 'normal',
    },
  },

  title: {
    fontSize: '1.3em',
    fontWeight: 500,
    margin: 0,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },

  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  description: {
    display: 'flex',
    alignItems: 'center',
    margin: '0 0 -.25em',
    textOverflow: 'ellipsis',
    overflow: 'hidden',

    '@media (max-width: 480px)': {
      margin: '.5em 0 0',
    },
  },

  error: {
    color: 'red',
  },

  reimportBtn: {
    cursor: 'pointer',
  },

  spinningBtn: {
    animationDuration: '1s',
    animationName: [rotation],
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
});
