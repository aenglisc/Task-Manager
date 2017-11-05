import 'babel-polyfill';

import gulp from 'gulp';
import gutil from 'gulp-util';
import repl from 'repl';

import app from './src';
import container from './src/container';
import init from './src/init';

gulp.task('console', () => {
  gutil.log = gutil.noop;
  const replServer = repl.start({
    prompt: 'Application console > ',
  });

  Object.keys(container).forEach((key) => {
    replServer.context[key] = container[key];
  });
});

gulp.task('init', () => {
  init();
});

gulp.task('server', () => {
  app().listen(process.env.PORT);
});
