import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import Spinner from '../shared/Spinner';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import ModalDialog from '../shared/ModalDialog';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  theme: ThemeName;
};

class ModalPublishing extends React.Component<Props> {
  render() {
    return (
      <ModalDialog
        visible={this.props.visible}
        onDismiss={this.props.onDismiss}
        title="Saving Snack…">
        <div className={css(styles.content)}>
          <Spinner />
        </div>
      </ModalDialog>
    );
  }
}

export default withThemeName(ModalPublishing);

const styles = StyleSheet.create({
  content: {
    margin: '16px 8px 12px',
  },
});
