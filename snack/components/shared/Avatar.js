/**
 * @flow
 */
import * as React from 'react';
import { StyleSheet, css } from 'aphrodite';

export default class Avatar extends React.PureComponent<
  {
    size?: string,
    src?: string,
    borderRadius?: string,
    style?: { [key: string]: any },
  },
  { loaded: boolean }
> {
  state = {
    loaded: false,
  };

  componentDidMount() {
    if (!this.props.src) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      this.setState({
        loaded: true,
      });
    };
    img.src = this.props.src;
  }

  static defaultProps = {
    borderRadius: '50%',
  };

  render() {
    const style = {
      backgroundImage: this.state.loaded && this.props.src ? `url('${this.props.src}')` : undefined,
      width: this.props.size,
      height: this.props.size,
      borderRadius: this.props.borderRadius,
      ...this.props.style,
    };

    const classes = css(styles.avatar, this.state.loaded ? styles.avatarLoaded : undefined);

    return <figure className={classes} style={style} />;
  }
}

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    opacity: 0.5,
    display: 'inline-block',
    backgroundSize: 'cover',
    backgroundColor: '#000000',
    backgroundPosition: '50% 50%',
    transition: '100ms linear opacity',
    position: 'relative',
  },
  avatarLoaded: {
    opacity: 1,
  },
});
