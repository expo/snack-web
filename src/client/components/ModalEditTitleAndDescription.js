/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

import Button from './shared/Button';
import ModalDialog from './shared/ModalDialog';
import LargeInput from './shared/LargeInput';
import Form from './Form/Form';
import LargeTextArea from './shared/LargeTextArea';
import withStatus from './Form/withStatus';
import withValidation from './Form/withValidation';
import colors from '../configs/colors';
import * as defaults from '../configs/defaults';

type Props = {|
  visible: boolean,
  title: string,
  action: string,
  onSubmit: (details: { name: string, description: string }) => mixed,
  onDismiss: () => mixed,
  description: ?string,
  name: string,
  isWorking?: boolean,
|};

type State = {
  name: string,
  description: string,
};

const FormButton = withStatus(Button);
const ValidatedInput = withValidation(LargeInput);

export default class ModalEditTitleAndDescription extends React.Component<Props, State> {
  state = {
    name: this.props.name || '',
    description: this.props.description || '',
  };

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.visible !== nextProps.visible && nextProps.visible) {
      this.setState({
        name: nextProps.name || '',
        description: nextProps.description || '',
      });
    }
  }

  _handleSubmit = () => {
    this.props.onSubmit({
      name: this.state.name,
      description: this.state.description,
    });
  };

  _validateName = (name: string) =>
    name
      ? /^[a-z_\-\d\s]+$/i.test(name)
        ? null
        : new Error('Name can only contain letters, numbers, space, hyphen (-) and underscore (_).')
      : new Error('Name cannot be empty.');

  render() {
    const { visible, title, onDismiss, isWorking, action } = this.props;

    return (
      <ModalDialog visible={visible} title={title} onDismiss={onDismiss}>
        <Form onSubmit={this._handleSubmit}>
          <h4 className={css(styles.subtitle)}>Project name</h4>
          <ValidatedInput
            autoFocus
            value={this.state.name}
            onChange={e => this.setState({ name: e.target.value })}
            placeholder={'Unnamed Snack'}
            validate={this._validateName}
          />
          <h4 className={css(styles.subtitle)}>Description</h4>
          <LargeTextArea
            value={this.state.description}
            onChange={e => this.setState({ description: e.target.value })}
            minRows={4}
            default={defaults.DEFAULT_DESCRIPTION}
          />
          <div className={css(styles.buttons)}>
            <FormButton type="submit" large variant="secondary" loading={isWorking}>
              {action}
            </FormButton>
          </div>
        </Form>
      </ModalDialog>
    );
  }
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 16,
    fontWeight: 500,
    padding: 0,
    lineHeight: '22px',
    margin: '16px 0 6px 0',
  },
  buttons: {
    margin: '20px 0 0 0',
  },
  caption: {
    marginTop: 24,
    fontSize: '16px',
    lineHeight: '22px',
    textAlign: 'center',
  },
  link: {
    cursor: 'pointer',
    color: colors.primary,
    textDecoration: 'underline',
  },
});
