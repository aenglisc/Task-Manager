import 'babel-polyfill';

import gulp from 'gulp';
// import gutil from 'gulp-util';
// import repl from 'repl';

import getServer from './src';

gulp.task('server', () => {
  getServer().listen(process.env.PORT);
});
