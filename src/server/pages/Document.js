/* @flow */

import React from 'react';
import jsesc from 'jsesc';
import GoogleAnalytics from '../components/GoogleAnalytics';
import Segment from '../components/SegmentDocumentComponent';
import resources from '../../../resources.json';

type Props = {
  id: ?string,
  splitTestSettings: Object,
  data:
    | {
        type: 'success',
        snack: ?Object,
      }
    | {
        type: 'error',
        error: { message: string },
      },
  content: { html: string, css: { content: string, renderedClassNames: string[] } },
};

const css: any = String.raw;

const DEFAULT_DESCRIPTION = 'No description';
const DEFAULT_METADATA_NAME = 'Snack - React Native in the browser';
const DEFAULT_METADATA_DESCRIPTION_EMPTY = `Write code in Expo's online editor and instantly use it on your phone.`;
const DEFAULT_METADATA_DESCRIPTION_SAVED = `Try this project on your phone! Use Expo's online editor to make changes and save your own copy.`;

export default class Document extends React.Component<Props> {
  render() {
    const { id, data, content, splitTestSettings } = this.props;
    const title =
      data.type === 'success' && data.snack && data.snack.manifest.name
        ? data.snack.manifest.name
        : DEFAULT_METADATA_NAME;
    const description =
      data.type === 'success' && data.snack
        ? data.snack.manifest.description && data.snack.manifest.description !== DEFAULT_DESCRIPTION
          ? data.snack.manifest.description
          : DEFAULT_METADATA_DESCRIPTION_EMPTY
        : DEFAULT_METADATA_DESCRIPTION_SAVED;
    const url = id ? `https://snack.expo.io/${id}` : `https://snack.expo.io`;
    const image = 'https://s3.amazonaws.com/exp-brand-assets/ExpoIcon_200.png';

    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

          <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
          <meta name="description" content={description} />

          <title>{title}</title>

          <meta property="og:url" content={url} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:type" content="website" />

          <meta property="og:image" content={image} />
          <meta property="og:image:width" content="200" />
          <meta property="og:image:height" content="200" />

          <meta name="twitter:card" content="summary" />
          <meta name="twitter:site" content="@expo" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={image} />

          <meta
            name="google-site-verification"
            content="Fh25fNM-buRYptb-TO6MVgOjXGzdhmAnRgIC7sdrmbw"
          />

          <link rel="shortcut icon" href="/favicon.ico" />

          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,300,500,600"
          />
          <link rel="stylesheet" href={resources.normalize} />

          <style
            type="text/css"
            dangerouslySetInnerHTML={{
              __html: css`
                :root {
                  --font-normal: 'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  --font-monospace: 'Fira Code', 'Fira Mono', Monaco, Menlo, 'Ubuntu Mono', Consolas,
                    source-code-pro, monospace;
                }

                html {
                  box-sizing: border-box;
                }

                *,
                *:before,
                *:after {
                  box-sizing: inherit;
                }

                *:focus {
                  outline: none;
                }

                *:focus-visible {
                  outline: auto;
                }

                html,
                body {
                  height: 100%;
                  width: 100%;
                }

                body {
                  font-family: var(--font-normal);
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

                a {
                  color: #4099ff;
                }
              `,
            }}
          />

          <style
            type="text/css"
            data-aphrodite
            dangerouslySetInnerHTML={{ __html: content.css.content }}
          />

          <script
            dangerouslySetInnerHTML={{
              __html: `
               window.__INITIAL_DATA__ = ${jsesc(
                 {
                   data,
                   splitTestSettings,
                 },
                 {
                   quotes: 'double',
                   isScriptContext: true,
                 }
               )} `,
            }}
          />
        </head>

        <body>
          <div id="root" dangerouslySetInnerHTML={{ __html: content.html }} />
          <Segment splitTestSettings={splitTestSettings} />
          <GoogleAnalytics propertyId="UA-53647600-5" />
          <script src={resources['babel-polyfill']} />
          <script src="/dist/app.bundle.js" />
        </body>
      </html>
    );
  }
}
