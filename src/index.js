import Koa from 'koa';
import Pug from 'koa-pug';
import Router from 'koa-router';

import Rollbar from 'rollbar';

import bodyParser from 'koa-bodyparser';
import koaLogger from 'koa-logger';
import methodOverride from 'koa-methodoverride';
import serve from 'koa-static';
import session from 'koa-generic-session';
import webpack from 'koa-webpack';

import _ from 'lodash';
import path from 'path';

import flash from './middlewares/flash';
import addRoutes from './routes';
import container from './container';
import getWebpackConfig from '../webpack.config.babel';

export default () => {
  container.logger('Creating server');
  const app = new Koa();
  const router = new Router();
  const rollbar = new Rollbar(process.env.ROLLBAR_ACCESS_TOKEN);

  app.use(async (ctx, next) => {
    try {
      await next();
      const status = ctx.status || 404;
      if (status === 404) {
        ctx.throw(404);
      }
    } catch (err) {
      container.logger(err);
      ctx.status = err.status || 500;
      if (ctx.status === 404) {
        ctx.render('errors/404');
      } else {
        rollbar.error(err, ctx.request);
      }
    }
  });

  addRoutes(router, container);

  app.keys = ['enigma'];
  app.use(session(app));
  app.use(flash());
  app.use(async (ctx, next) => {
    ctx.state = {
      flash: ctx.flash,
      id: ctx.session.id,
      isSignedIn: () => ctx.session.id !== undefined,
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
  app.use(serve(path.join(__dirname, '..', 'public')));
  app.use(koaLogger());
  app.use(router.allowedMethods());
  app.use(router.routes());

  if (process.env.NODE_ENV !== 'test') {
    app.use(webpack({
      config: getWebpackConfig(),
    }));
  }

  const pug = new Pug({
    viewPath: path.join(__dirname, 'views'),
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: [],
    basedir: path.join(__dirname, 'views'),
    helperPath: [
      { _ },
      { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);

  container.logger('The server has been created');
  return app;
};
