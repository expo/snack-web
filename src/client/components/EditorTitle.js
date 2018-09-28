/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import distanceInWords from 'date-fns/distance_in_words';

import Popover from './shared/Popover';
import EditableField from './shared/EditableField';
import ModalEditTitleAndDescription from './ModalEditTitleAndDescription';
import withThemeName, { type ThemeName } from './Preferences/withThemeName';
import colors from '../configs/colors';
import * as defaults from '../configs/defaults';
import type { SaveStatus, Viewer } from '../types';

type Props = {|
  name: string,
  description: ?string,
  createdAt: ?string,
  saveHistory: ?Array<{ id: string, savedAt: string }>,
  saveStatus: SaveStatus,
  viewer: ?Viewer,
  isEditModalVisible: boolean,
  onShowEditModal: () => mixed,
  onDismissEditModal: () => mixed,
  onSubmitMetadata: (
    details: { name: string, description: string },
    draft?: boolean
  ) => Promise<void>,
  onLogInClick: () => mixed,
  theme: ThemeName,
|};

type State = {
  date: Date,
};

class EditorTitle extends React.Component<Props, State> {
  state = {
    date: new Date(),
  };

  componentDidMount() {
    this._timer = setInterval(() => this.setState({ date: new Date() }), 10000);
  }

  componentWillUnmount() {
    clearInterval(this._timer);
  }

  _timer: IntervalID;

  _handleSubmitTitle = name =>
    this.props.onSubmitMetadata({ name, description: this.props.description || '' });

  render() {
    const {
      description,
      name,
      createdAt,
      saveHistory,
      saveStatus,
      viewer,
      theme,
      isEditModalVisible,
      onShowEditModal,
      onSubmitMetadata,
      onDismissEditModal,
      onLogInClick,
    } = this.props;

    const lastSave = saveHistory ? saveHistory[saveHistory.length - 1] : null;
    const savedAt = lastSave ? lastSave.savedAt : createdAt;

    let statusText;

    if (viewer) {
      // User is logged in
      if (saveStatus === 'saving-draft') {
        statusText = 'Saving changes…';
      } else {
        if (savedAt) {
          const dtSavedAt = new Date(savedAt);
          const timestamp =
            this.state.date > dtSavedAt
              ? `${distanceInWords(this.state.date, dtSavedAt, {
                  includeSeconds: true,
                  addSuffix: true,
                })}`
              : '';

          if (saveStatus === 'changed') {
            statusText = `Last saved ${timestamp}`;
          } else {
            statusText = `All changes saved ${timestamp}`;
          }
        } else {
          statusText = 'Not saved yet';
        }
      }

      statusText = <span className={css(styles.statusText)}>{statusText}</span>;
    } else {
      // User is a guest
      statusText = (
        <React.Fragment>
          <button onClick={onLogInClick} className={css(styles.loginButton)}>
            Log in
          </button>{' '}
          <span className={css(styles.statusText)}>to save your changes as you work</span>
        </React.Fragment>
      );
    }

    return (
      <div className={css(styles.container)}>
        <div className={css(styles.header)}>
          <div className={css(styles.titleContainer)}>
            <h1 className={css(styles.title)}>
              <EditableField value={name} onSubmitText={this._handleSubmitTitle} />
            </h1>
            <Popover
              content={
                <React.Fragment>
                  <p className={css(styles.description)}>
                    {description || defaults.DEFAULT_DESCRIPTION}
                  </p>
                  <button onClick={onShowEditModal} className={css(styles.editButton)}>
                    Edit details
                  </button>
                </React.Fragment>
              }>
              <button
                className={css(styles.icon, theme === 'light' ? styles.infoLight : styles.infoDark)}
              />
            </Popover>
          </div>
          <div className={css(styles.metadata)}>
            <p className={css(styles.status)}>{statusText}</p>
            {viewer && saveStatus === 'saving-draft' ? (
              <div className={css(styles.spinner)} />
            ) : null}
            {(viewer && saveStatus === 'saved-draft') || saveStatus === 'published' ? (
              <svg className={css(styles.check)} width="11px" height="8px" viewBox="0 0 11 8">
                <polygon
                  fill="#4CAF50"
                  points="3.34328358 6.32835821 0.835820896 3.82089552 0 4.65671642 3.34328358 8 10.5074627 0.835820896 9.67164179 0"
                />
              </svg>
            ) : null}
          </div>
        </div>
        <ModalEditTitleAndDescription
          title="Edit Snack Details"
          action="Done"
          visible={isEditModalVisible}
          onDismiss={onDismissEditModal}
          onSubmit={details => {
            onSubmitMetadata(details);
            onDismissEditModal();
          }}
          description={description}
          name={name}
        />
      </div>
    );
  }
}

export default withThemeName(EditorTitle);

const spin = {
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    height: '100%',
  },

  header: {
    padding: 2,
    minWidth: 0,
  },

  title: {
    fontSize: '1.3em',
    lineHeight: '1.3em',
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

  metadata: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },

  status: {
    fontSize: 12,
    margin: '0 6px',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },

  loginButton: {
    appearance: 'none',
    background: 'none',
    border: 0,
    margin: 0,
    padding: 0,
    textDecoration: 'underline',
  },

  statusText: {
    opacity: 0.5,
  },

  spinner: {
    borderStyle: 'solid',
    borderTopColor: colors.primary,
    borderLeftColor: colors.primary,
    borderBottomColor: colors.primary,
    borderRightColor: 'rgba(0, 0, 0, .16)',
    borderWidth: 1,
    height: 12,
    width: 12,
    borderRadius: '50%',
    margin: '0 4px',
    animationDuration: '1s',
    animationName: [spin],
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },

  check: {
    marginBottom: -4,
  },

  icon: {
    display: 'block',
    position: 'relative',
    appearance: 'none',
    backgroundColor: 'transparent',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 16,
    backgroundPosition: 'center',
    border: 0,
    outline: 0,
    margin: 0,
    padding: 0,
    height: 24,
    width: 24,
    opacity: 0.3,
    transition: '.2s',

    ':hover': {
      opacity: 0.8,
    },
  },

  description: {
    margin: 16,
  },

  modal: {
    padding: '1em 1.5em',
    borderRadius: 3,
    width: 360,
    maxWidth: '100%',
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.07)',
  },

  infoLight: {
    backgroundImage: `url(${require('../assets/info-icon.png')})`,
  },

  infoDark: {
    backgroundImage: `url(${require('../assets/info-icon-light.png')})`,
  },

  editButton: {
    width: '100%',
    background: 'none',
    outline: 0,
    borderWidth: '1px 0 0 0',
    borderColor: colors.border,
    padding: '8px 16px',
  },
});
