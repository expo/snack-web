/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import querystring from 'query-string';

import Button from './shared/Button';
import ProgressIndicator from './shared/ProgressIndicator';
import ModalDialog from './shared/ModalDialog';
import LargeInput from './shared/LargeInput';
import Segment from '../utils/Segment';
import withThemeName, { type ThemeName } from './Preferences/withThemeName';

type Props = {|
  visible: boolean,
  onHide: () => void,
  preventRedirectWarning: () => void,
  theme: ThemeName,
|};

type State = {|
  status: 'idle' | 'importing' | 'error',
  url: string,
  path: string,
  branch: string,
|};

const TIMEOUT_MS = 45000;

class RepoImportManager extends React.PureComponent<Props, State> {
  state: State = {
    status: 'idle',
    url: '',
    path: '',
    branch: '',
  };

  _hideImportModal = () => {
    Segment.getInstance().logEvent('IMPORT_COMPLETED', { reason: 'dismiss' }, 'importStart');
    this.setState({
      status: 'idle',
      url: '',
      path: '',
      branch: '',
    });
    this.props.onHide();
  };

  _handleImportRepoClick = async (e: *) => {
    e.preventDefault();
    this.setState({
      status: 'importing',
    });

    // If the import hangs we want to make sure to throw an error
    setTimeout(() => {
      if (this.props.visible && this.state.status === 'importing') {
        this.setState({
          status: 'error',
        });
      }
    }, TIMEOUT_MS);

    let res;
    let snackId;
    let didFail = false;
    try {
      if (!process.env.IMPORT_SERVER_URL) {
        throw 'missing IMPORT_SERVER_URL';
      }
      const IMPORT_API_URL = `${process.env.IMPORT_SERVER_URL}/git`;

      let params = {
        repo: this.state.url,
      };
      if (this.state.path) {
        /* $FlowFixMe */
        params.subpath = this.state.path;
      }
      if (this.state.branch) {
        /* $FlowFixMe */
        params.branch = this.state.branch;
      }

      res = await fetch(`${IMPORT_API_URL}?${querystring.stringify(params)}`);
      snackId = await res.text();
      if (this.props.visible) {
        if (res.ok) {
          Segment.getInstance().logEvent('IMPORT_COMPLETED', { reason: 'success' }, 'importStart');
          this.props.preventRedirectWarning();
          window.location = `/${snackId}`;
        } else {
          didFail = true;
        }
      }
    } catch (e) {
      didFail = true;
    }

    if (didFail) {
      this.setState({
        status: 'error',
      });
      Segment.getInstance().logEvent('IMPORT_COMPLETED', { reason: 'error' }, 'importStart');
    } else {
      this.setState({
        status: 'idle',
      });
    }
  };

  _handleChange = (e: *) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  render() {
    const { status } = this.state;
    const importing = status === 'importing';
    const error = status === 'error';

    return (
      <ModalDialog
        visible={this.props.visible}
        onDismiss={this._hideImportModal}
        title="Import git repository">
        {importing ? <ProgressIndicator duration={45000} className={css(styles.progress)} /> : null}
        <form onSubmit={this._handleImportRepoClick}>
          <p className={!error ? css(styles.paragraph) : css(styles.errorParagraph)}>
            {!error
              ? 'Import an Expo project from a Git repository to use in your expo project.'
              : 'An error occurred during import. This could be because the data provided was invalid, or because the repository referenced is not a properly formatted Expo project.'}
          </p>
          <h4 className={css(styles.subtitle)}>Git Repository</h4>
          <LargeInput
            name="url"
            theme={this.props.theme}
            value={this.state.url}
            onChange={this._handleChange}
            placeholder={'https://github.com/ide/love-languages.git'}
            autofocus
          />
          <h4 className={css(styles.subtitle)}>Subpath</h4>
          <LargeInput
            name="path"
            theme={this.props.theme}
            value={this.state.path}
            onChange={this._handleChange}
            placeholder={'/example/app'}
          />
          <h4 className={css(styles.subtitle)}>Branch</h4>
          <LargeInput
            name="branch"
            theme={this.props.theme}
            value={this.state.branch}
            onChange={this._handleChange}
            placeholder={'master'}
          />
          <Button
            large
            disabled={!this.state.url}
            loading={importing}
            type="submit"
            variant="secondary">
            {importing ? 'Importing repository…' : 'Import repository'}
          </Button>
        </form>
      </ModalDialog>
    );
  }
}

export default withThemeName(RepoImportManager);

const styles = StyleSheet.create({
  paragraph: {
    margin: '8px 0 16px',
  },

  errorParagraph: {
    margin: '8px 0 16px',
    color: 'red',
  },

  subtitle: {
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
    lineHeight: '22px',
    margin: '16px 0 6px 0',
  },

  progress: {
    marginTop: -16,
  },
});
