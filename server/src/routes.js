/* @flow */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import path from 'path';
import compose from 'koa-compose';
import Router from 'koa-router';
import send from 'koa-send';
import cors from '@koa/cors';
import Document from './pages/Document';
import * as EmbeddedSnackScript from './EmbeddedSnackScript';
import getSplitTests from './utils/getSplitTests';

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

  router.get('*', async ctx => {
    const splitTestSettings = await getSplitTests(ctx);
    const index =
      '<!DOCTYPE html>' +
      ReactDOMServer.renderToStaticMarkup(<Document splitTestSettings={splitTestSettings} />);

    ctx.body = index;
    ctx.type = 'html';
  });

  return compose([router.routes(), router.allowedMethods()]);
}
