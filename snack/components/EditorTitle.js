/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import { format } from 'date-fns';

import Popover from './shared/Popover';
import EditableField from './shared/EditableField';
import ModalEditTitleAndDescription from './ModalEditTitleAndDescription';
import withThemeName, { type ThemeName } from './Preferences/withThemeName';
import colors from '../configs/colors';
import * as defaults from '../configs/defaults';

type Props = {
  name: string,
  description: ?string,
  createdAt?: string,
  isEditModalVisible: boolean,
  onShowEditModal: () => mixed,
  onDismissEditModal: () => mixed,
  onSubmitEditModal: (details: { name: string, description: string }) => mixed,
  theme: ThemeName,
};

class EditorTitle extends React.PureComponent<Props> {
  _handleSubmitTitle = name =>
    this.props.onSubmitEditModal({ name, description: this.props.description || '' });

  render() {
    const {
      description,
      name,
      createdAt,
      theme,
      isEditModalVisible,
      onShowEditModal,
      onSubmitEditModal,
      onDismissEditModal,
    } = this.props;

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
          <p className={css(styles.timestamp)}>
            {createdAt
              ? format(new Date(createdAt), '[Created on] Do MMM, YYYY [at] h:mm a')
              : 'Created just now'}
          </p>
        </div>
        <ModalEditTitleAndDescription
          title="Edit Snack Details"
          action="Done"
          visible={isEditModalVisible}
          onDismiss={onDismissEditModal}
          onSubmit={details => {
            onSubmitEditModal(details);
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

  timestamp: {
    fontSize: 12,
    margin: '0 6px',
    opacity: 0.5,
    textOverflow: 'ellipsis',
    overflow: 'hidden',

    '@media (max-width: 480px)': {
      margin: '.5em 0 0',
    },
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
    padding: 4,
    height: 24,
    width: 40,
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
