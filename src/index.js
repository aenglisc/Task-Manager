import Koa from 'koa';
import Pug from 'koa-pug';
import Router from 'koa-router';

import Rollbar from 'rollbar';

import bodyParser from 'koa-bodyparser';
import flash from 'koa-flash-simple';
import koaLogger from 'koa-logger';
import methodOverride from 'koa-methodoverride';
import middleware from 'koa-webpack';
import serve from 'koa-static';
import session from 'koa-generic-session';

import _ from 'lodash';
import path from 'path';

import addRoutes from './routes';
import container from './container';
import getWebpackConfig from '../webpack.config.babel';

export default () => {
  const app = new Koa();
  const router = new Router();
  const rollbar = new Rollbar(process.env.ROLLBAR_ACCESS_TOKEN);

  addRoutes(router, container);

  app.keys = ['some secret hurr'];
  app.use(session(app));
  app.use(flash());
  app.use(async (ctx, next) => {
    ctx.state = {
      flash: ctx.flash,
      isSignedIn: () => ctx.session.userId !== undefined,
    };
    await next();
  });
  app.use(bodyParser());
  app.use(methodOverride((req) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      return req.body._method; // eslint-disable-line
    }
    return null;
  }));
  app.use(async (ctx, next) => {
    try {
      ctx.state = {
        flash: ctx.flash,
        isSignedIn: () => ctx.session.userId !== undefined,
      };
      await next();
    } catch (err) {
      rollbar.error(err, ctx.request);
    }
  });
  app.use(serve(path.join(__dirname, '..', 'public')));
  app.use(koaLogger());
  app.use(router.allowedMethods());
  app.use(router.routes());

  if (process.env.NODE_ENV !== 'test') {
    app.use(middleware({
      config: getWebpackConfig(),
    }));
  }

  const pug = new Pug({
    viewPath: path.join(__dirname, '../views'),
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: [],
    basedir: path.join(__dirname, '../views'),
    helperPath: [
      { _ },
      { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);

  return app;
};