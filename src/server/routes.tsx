import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom';
import { StyleSheetServer } from 'aphrodite';
import { Context } from 'koa';
import compose from 'koa-compose';
import Router from 'koa-router';
import send from 'koa-send';
import fetch from 'node-fetch';
import nullthrows from 'nullthrows';
import Document from './pages/Document';
import { URL } from 'url';
import * as EmbeddedSnackScript from './EmbeddedSnackScript';
import getSplitTests from './utils/getSplitTests';
import createStore from '../client/redux/createStore';
import ClientRouter from '../client/components/Router';
import PreferencesProvider from '../client/components/Preferences/PreferencesProvider';
import ColorsProvider from '../client/components/ColorsProvider';
import ServiceWorkerManager from '../client/components/ServiceWorkerManager';

const render = async (ctx: Context) => {
  const id = ctx.params
    ? ctx.params.id
      ? ctx.params.id
      : ctx.params.username && ctx.params.projectName
      ? `@${ctx.params.username}/${ctx.params.projectName}`
      : null
    : null;
  const splitTestSettings = await getSplitTests(ctx);

  let data:
    | { type: 'error'; error: { message: string } }
    | {
        type: 'success';
        snack: {
          manifest: {
            name: string;
            description: string;
          };
        } | null;
      };
  let postData: object | null;
  postData = null;

  if (id) {
    try {
      const expoSession = ctx.cookies.get('io.expo.auth.sessionSecret');

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
    if (ctx.request.body) {
      postData = ctx.request.body;
    }
    data = {
      type: 'success',
      snack: null,
    };
  }

  const store = createStore({ splitTestSettings });
  const context: { url?: string } = {};
  const cookies = {
    get: (key: string) => {
      const result = ctx.cookies.get(key);

      if (result) {
        return decodeURIComponent(result);
      }

      return result;
    },
  };

  const index =
    '<!DOCTYPE html>' +
    ReactDOMServer.renderToStaticMarkup(
      <Document
        id={id}
        splitTestSettings={splitTestSettings}
        data={data}
        postData={postData}
        content={StyleSheetServer.renderStatic(() => {
          return ReactDOMServer.renderToString(
            <React.Fragment>
              <ServiceWorkerManager />
              <Provider store={store}>
                <PreferencesProvider cookies={cookies} search={ctx.request.search}>
                  <ColorsProvider>
                    <StaticRouter location={ctx.request.url} context={context}>
                      <ClientRouter data={data} postData={postData} userAgent={ctx.userAgent} />
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
  const router = new Router();
  const player = new Router();

  player.get('*', async (ctx: Context) => {
    if (!process.env.SNACK_APP_URL) {
      throw new Error(
        'The "SNACK_APP_URL" environment variable must be defined to proxy the Web player.'
      );
    }

    const url = new URL(process.env.SNACK_APP_URL);

    url.pathname = ctx.request.path.replace(/^\/web-player/, '');
    url.search = ctx.request.search;

    try {
      const response = await fetch(url.toString(), {
        headers: ctx.request.headers,
        method: ctx.request.method,
      });

      ctx.type = response.type;
      ctx.status = response.status;
      ctx.body = await response.text();
    } catch (e) {
      console.log(e);
      ctx.throw(e);
    }
  });

  router.use('/web-player', player.routes());

  router.get('/favicon.ico', async (ctx: Context) => {
    await send(ctx, 'favicon.ico');
  });

  router.get('/embed.js', async (ctx: Context) => {
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
  router.post('*', render);

  return compose([router.routes(), router.allowedMethods()]);
}
