/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import ModalEditTitleAndDescription from './ModalEditTitleAndDescription';
import withThemeName, { type ThemeName } from './Preferences/withThemeName';
import * as defaults from '../configs/defaults';



type Props = {
  name: string,
  description: ?string,
  isEditModalVisible: boolean,
  onShowEditModal: () => mixed,
  onDismissEditModal: () => mixed,
  onSaveEditModal: (details: { name: string, description: string }) => mixed,
  theme: ThemeName,
};

class EditorTitle extends React.PureComponent<Props> {
  render() {
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.header)} onClick={this.props.onShowEditModal}>
          <div className={css(styles.titleContainer)}>
            <h1 className={css(styles.title)}>{this.props.name}</h1>
            <button
              className={css(
                styles.icon,
                this.props.theme === 'light' ? styles.editIconLight : styles.editIconDark
              )}
              onClick={this.props.onShowEditModal}
            />
          </div>
          <p className={css(styles.description)}>
            {this.props.description || defaults.DEFAULT_DESCRIPTION}
          </p>
        </div>
        <ModalEditTitleAndDescription
          visible={this.props.isEditModalVisible}
          onDismiss={this.props.onDismissEditModal}
          onSubmit={details => {
            this.props.onSaveEditModal(details);
            this.props.onDismissEditModal();
          }}
          description={this.props.description}
          name={this.props.name}
        />
      </div>
    );
  }
}

export default withThemeName(EditorTitle);

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
    cursor: 'pointer',

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
    fontSize: 12,
    margin: 0,
    opacity: 0.5,
    textOverflow: 'ellipsis',
    overflow: 'hidden',

    '@media (max-width: 480px)': {
      margin: '.5em 0 0',
    },
  },

  icon: {
    display: 'flex',
    flexShrink: 0,
    appearance: 'none',
    backgroundColor: 'transparent',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    border: 0,
    outline: 0,
    padding: 0,
    margin: '2px 12px',
    height: 16,
    width: 16,
    opacity: 0.3,
    transition: '.2s',

    ':hover': {
      opacity: 0.8,
    },
  },

  editIconLight: {
    backgroundImage: `url(${require('../assets/edit-icon.png')})`,
  },

  editIconDark: {
    backgroundImage: `url(${require('../assets/edit-icon-light.png')})`,
  },

  modal: {
    padding: '1em 1.5em',
    borderRadius: 3,
    width: 360,
    maxWidth: '100%',
    boxShadow: '0 1px 8px rgba(0, 0, 0, 0.07)',
  },

  h2: {
    fontSize: '1.5em',
    marginTop: '.5em',
  },

  h4: {
    fontSize: '1em',
  },
});
