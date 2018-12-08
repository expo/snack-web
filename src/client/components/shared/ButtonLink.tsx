import * as React from 'react';
import classnames from 'classnames';
import { getClassNames, ButtonCommonProps } from './Button';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import Segment from '../../utils/Segment';

type Props = ButtonCommonProps & {
  href?: string;
  target?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
  className?: string;
  theme: ThemeName;
};

function ButtonLink({ variant, icon, large, disabled, loading, theme, className, ...rest }: Props) {
  const onClick = () => {
    Segment.getInstance().logEvent('CLICKED_LINK', { target: rest.href }, 'previewQueue');
  };

  return (
    <a
      className={classnames(
        getClassNames({ variant, icon, large, disabled, loading, theme }),
        className
      )}
      onClick={onClick}
      style={icon ? { backgroundImage: `url(${icon})` } : {}}
      {...rest}
    />
  );
}

export default withThemeName(ButtonLink);
