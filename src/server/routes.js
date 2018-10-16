/* @flow */

import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom';
import { StyleSheetServer } from 'aphrodite';
import path from 'path';
import compose from 'koa-compose';
import Router from 'koa-router';
import send from 'koa-send';
import cors from '@koa/cors';
import fetch from 'node-fetch';
import nullthrows from 'nullthrows';
import Document from './pages/Document';
import * as EmbeddedSnackScript from './EmbeddedSnackScript';
import getSplitTests from './utils/getSplitTests';
import createStore from '../client/redux/createStore';
import ClientRouter from '../client/components/Router';
import PreferencesProvider from '../client/components/Preferences/PreferencesProvider';
import ColorsProvider from '../client/components/ColorsProvider';
import ServiceWorkerManager from '../client/components/ServiceWorkerManager';

const render = async ctx => {
  const id = ctx.params
    ? ctx.params.id
      ? ctx.params.id
      : ctx.params.username && ctx.params.projectName
        ? `@${ctx.params.username}/${ctx.params.projectName}`
        : null
    : null;
  const splitTestSettings = await getSplitTests(ctx);

  let data;

  if (id) {
    try {
      let expoSession = ctx.cookies.get('io.expo.auth.sessionSecret');

      const response = await fetch(
        `${nullthrows(process.env.API_SERVER_URL)}/--/api/v2/snack/${id}`,
        {
          headers: {
            'Snack-Api-Version': '3.0.0',
            ...(expoSession ? { 'expo-session': decodeURIComponent(expoSession) } : {}),
          },
        }
      );

      const text = await response.text();
      const snack = JSON.parse(text);

      if (snack.errors && snack.errors.length) {
        data = {
          type: 'error',
          error: { message: 'Server returned errors when fetching data' },
        };
      } else {
        data = {
          type: 'success',
          snack,
        };
      }
    } catch (error) {
      data = {
        type: 'error',
        error: { message: error.message },
      };
    }
  } else {
    data = {
      type: 'success',
      snack: null,
    };
  }

  const store = createStore({ splitTestSettings });
  const context = {};

  const index =
    '<!DOCTYPE html>' +
    ReactDOMServer.renderToStaticMarkup(
      <Document
        id={id}
        splitTestSettings={splitTestSettings}
        data={data}
        content={StyleSheetServer.renderStatic(() => {
          return ReactDOMServer.renderToString(
            <React.Fragment>
              <ServiceWorkerManager />
              <Provider store={store}>
                <PreferencesProvider>
                  <ColorsProvider>
                    <StaticRouter location={ctx.request.url} context={context}>
                      <ClientRouter data={data} userAgent={ctx.userAgent} />
                    </StaticRouter>
                  </ColorsProvider>
                </PreferencesProvider>
              </Provider>
            </React.Fragment>
          );
        })}
      />
    );

  if (context.url) {
    ctx.redirect(context.url);
  } else {
    ctx.body = index;
    ctx.type = 'html';
  }
};

export default function routes() {
  let router = new Router();

  router.get('/favicon.ico', async ctx => {
    await send(ctx, 'favicon.ico');
  });

  router.use('/static/:path+', cors());
  router.get('/static/:path+', async ctx => {
    await send(ctx, path.join('static', ctx.params.path));
  });

  router.get('/dist/:path+', async ctx => {
    await send(ctx, path.join('dist', ctx.params.path));
  });

  router.get('/embed.js', async ctx => {
    ctx.type = 'application/javascript';
    ctx.set('ETag', EmbeddedSnackScript.hash);
    ctx.set('Cache-Control', 'public');
    ctx.body = EmbeddedSnackScript.script;
  });

  router.get('/embedded/@:username/:projectName+', render);
  router.get('/embedded/:id', render);
  router.get('/embedded', render);
  router.get('/@:username/:projectName+', render);
  router.get('/:id', render);
  router.get('*', render);

  return compose([router.routes(), router.allowedMethods()]);
}
