import * as React from 'react';
import ReactDOM from 'react-dom';
import { StyleSheet, css } from 'aphrodite';

type Props = {
  direction: 'horizontal' | 'vertical';
  children?: React.ReactNode;
  className?: string;
};

type State = {
  resizing: boolean;
  initialPosition: {
    pageX: number;
    pageY: number;
  } | null;
  initialWidth: number;
  initialHeight: number;
};

export default class ResizablePane extends React.PureComponent<Props, State> {
  state: State = {
    resizing: false,
    initialPosition: null,
    initialWidth: 0,
    initialHeight: 0,
  };

  componentDidMount() {
    // @ts-ignore
    document.addEventListener('mouseup', this._handleMouseUp);
    // @ts-ignore
    document.addEventListener('mousemove', this._handleMouseMove);
  }

  componentWillUnmount() {
    // @ts-ignore
    document.removeEventListener('mouseup', this._handleMouseUp);
    // @ts-ignore
    document.removeEventListener('mousemove', this._handleMouseMove);
  }

  _handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const style = getComputedStyle(this._pane);
    this.setState({
      resizing: true,
      initialPosition: {
        pageX: e.pageX,
        pageY: e.pageY,
      },
      initialWidth: parseFloat(style.width || '0'),
      initialHeight: parseFloat(style.height || '0'),
    });
  };

  _handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (this.state.resizing) {
      e.preventDefault();
      this.setState({
        resizing: false,
        initialPosition: null,
        initialWidth: 0,
        initialHeight: 0,
      });
    }
  };

  _handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { direction } = this.props;
    const { resizing, initialPosition, initialWidth, initialHeight } = this.state;

    if (resizing && initialPosition) {
      e.preventDefault();

      let style;

      if (direction === 'horizontal') {
        style = `width: ${initialWidth + e.pageX - initialPosition.pageX}px !important;`;
      } else {
        style = `height: ${initialHeight - e.pageY + initialPosition.pageY}px !important`;
      }

      this._pane.setAttribute('style', style);
    }
  };

  _pane: any;

  render() {
    return (
      <div
        // eslint-disable-next-line react/no-find-dom-node
        ref={(c: any) => (this._pane = ReactDOM.findDOMNode(c))}
        className={`${css(styles.container)} ${this.props.className || ''}`}>
        {this.props.children}
        <div
          className={css(
            styles.handle,
            this.props.direction === 'horizontal' ? styles.horizontal : styles.vertical
          )}
          onMouseDown={this._handleMouseDown}
          onMouseUp={this._handleMouseUp}
        />
      </div>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  handle: {
    position: 'absolute',
    zIndex: 1,
  },
  horizontal: {
    right: -12,
    top: 0,
    bottom: 0,
    width: 12,
    cursor: 'col-resize',
  },
  vertical: {
    top: -12,
    left: 0,
    right: 0,
    height: 12,
    cursor: 'row-resize',
  },
});
