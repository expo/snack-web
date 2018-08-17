/* @flow */

import * as React from 'react';
import classnames from 'classnames';
import { getClassNames, type ButtonCommonProps } from './Button';
import withThemeName, { type ThemeName } from '../Preferences/withThemeName';
import Segment from '../../utils/Segment';

type Props = ButtonCommonProps & {|
  href?: string,
  target?: string,
  onClick?: Function,
  children: React.Node,
  className?: string,
|};

function ButtonLink({ variant, icon, large, disabled, loading, theme, className, ...rest }: Props) {
  const onClick = () => {
    /* $FlowFixMe */
    Segment.getInstance().logEvent('CLICKED_LINK', { target: rest.href }, 'previewQueue');
  };

  return (
    <a
      className={classnames(
        getClassNames({ variant, icon, large, disabled, loading, theme }),
        className
      )}
      onClick={onClick}
      disabled={disabled}
      style={icon ? { backgroundImage: `url(${icon})` } : {}}
      {...rest}
    />
  );
}

export default withThemeName(ButtonLink);
