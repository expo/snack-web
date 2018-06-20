/* @flow */

import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';
import LoadingIndicator from 'react-loading-indicator';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';

import ModalDialog from '../shared/ModalDialog';

type Props = {|
  visible: boolean,
  onDismiss: () => mixed,
  theme: ThemeName,
|};

class ModalPublishing extends React.PureComponent<Props> {
  render() {
    return (
      <ModalDialog
        visible={this.props.visible}
        onDismiss={this.props.onDismiss}
        title="Saving Snack…">
        <div className={css(styles.content)}>
          <LoadingIndicator
            segmentLength={6}
            spacing={4}
            color={
              this.props.theme === 'dark'
                ? { red: 255, green: 255, blue: 255, alpha: 0.5 }
                : { red: 70, green: 48, blue: 235, alpha: 1 }
            }
          />
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
