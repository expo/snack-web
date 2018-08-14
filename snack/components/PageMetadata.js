/* @flow */

import * as React from 'react';
import Helmet from 'react-helmet';

type Props = {|
  name: string,
  description: string,
  params?: { id?: string },
|};

export default function PageMetadata({ name, description, params }: Props) {
  const url = params && params.id ? `https://snack.expo.io/${params.id}` : `https://snack.expo.io`;

  return (
    <Helmet
      title={name}
      meta={[
        { property: 'og:url', content: url },
        { property: 'og:title', content: name },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        {
          property: 'og:image',
          content: 'https://s3.amazonaws.com/exp-brand-assets/ExpoIcon_200.png',
        },
        { property: 'og:image:width', content: 200 },
        { property: 'og:image:height', content: 200 },
      ]}
    />
  );
}
