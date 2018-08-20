/**
 * @flow
 */
import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

type State = {
  loaded: boolean,
};

type Props = {
  size: number,
  source: string,
};

export default class Avatar extends React.Component<Props, State> {
  state = {
    loaded: false,
  };

  _handleLoad = () => this.setState({ loaded: true });

  render() {
    return (
      <div
        className={css(styles.container)}
        style={{
          width: this.props.size,
          height: this.props.size,
          borderRadius: this.props.size / 2,
        }}>
        <div
          className={css(styles.background)}
          style={{
            opacity: this.state.loaded ? 1 : 0,
          }}
        />
        {this.props.source ? (
          <img className={css(styles.avatar)} src={this.props.source} onLoad={this._handleLoad} />
        ) : null}
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    margin: 'auto',
  },
  avatar: {
    position: 'relative',
    height: '100%',
    width: '100%',
    margin: 0,
    display: 'block',
    transition: '100ms linear opacity',
    zIndex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    opacity: 0.2,
    backgroundColor: 'currentColor',
  },
});
