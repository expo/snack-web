/* @flow */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
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
      const response = await fetch(
        `${nullthrows(process.env.API_SERVER_URL)}/--/api/v2/snack/${id}`,
        { headers: { 'Snack-Api-Version': '3.0.0' } }
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

  const index =
    '<!DOCTYPE html>' +
    ReactDOMServer.renderToStaticMarkup(
      <Document id={id} splitTestSettings={splitTestSettings} data={data} />
    );

  ctx.body = index;
  ctx.type = 'html';
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
