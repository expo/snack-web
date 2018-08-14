/* @flow */

import React from 'react';
import GoogleAnalytics from '../components/GoogleAnalytics';
import Segment from '../components/SegmentDocumentComponent';
import resources from '../../../resources.json';

type Props = {
  splitTestSettings: Object,
};

const css: any = String.raw;

export default class Document extends React.Component<Props> {
  render() {
    const { splitTestSettings } = this.props;

    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>Snack</title>
          <link rel="shortcut icon" href="/favicon.ico" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,300,500,600"
          />
          <link rel="stylesheet" href={resources.normalize} />
          <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
          <style
            type="text/css"
            dangerouslySetInnerHTML={{
              __html: css`
                html {
                  box-sizing: border-box;
                }

                *,
                *:before,
                *:after {
                  box-sizing: inherit;
                }

                html,
                body {
                  height: 100%;
                  width: 100%;
                }

                body {
                  font-family: 'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  font-size: 14px;
                  line-height: 1.42857143;
                  overscroll-behavior: none;
                }

                button,
                input,
                select,
                textarea {
                  font: inherit;
                  color: inherit;
                  line-height: inherit;
                }

                button {
                  cursor: pointer;
                }

                button[disabled] {
                  cursor: default;
                }

                #root {
                  height: 100vh;
                }
              `,
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
              window.__INITIAL_DATA__ = {
                splitTestSettings: ${JSON.stringify(splitTestSettings)},
              }
            `,
            }}
          />
        </head>

        <body>
          <div id="root" />
          <Segment splitTestSettings={splitTestSettings} />
          <GoogleAnalytics propertyId="UA-53647600-5" />
          <script src={resources['babel-polyfill']} />
          <script src="/dist/app.bundle.js" />
        </body>
      </html>
    );
  }
}
