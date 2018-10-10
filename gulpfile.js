'use strict';

const child_process = require('child_process');
const gulp = require('gulp');
const babel = require('gulp-babel');
const changed = require('gulp-changed');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const spawnAsync = require('@expo/spawn-async');

gulp.task('clean', async () => {
  console.log(`Removing build directories...`);
  await Promise.all([del('dist'), del('server/build')]);
});

gulp.task('build:client', done => {
  console.log(`Building the client bundles...`);
  _spawnTask('node_modules/.bin/webpack', [], { stdio: 'inherit' }, done);
});

gulp.task('build:server', () => {
  console.log(`Compiling the Node.js server JavaScript...`);
  return gulp
    .src('server/src/**/*.js')
    .pipe(changed('server/build'))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(
      sourcemaps.write('.', {
        includeContent: false,
        sourceRoot: '../src',
      })
    )
    .pipe(gulp.dest('server/build'));
});

gulp.task('build', gulp.parallel('build:client', 'build:server'));

gulp.task('domain', async () => {
  console.log('Setting up snack.expo.test to forward requests to the Snack website...');
  await spawnAsync('node_modules/.bin/hotel', ['start'], { stdio: 'inherit' });
  await spawnAsync(
    'node_modules/.bin/hotel',
    ['add', 'http://localhost:3011', '--name', 'snack.expo'],
    { stdio: 'inherit' }
  );
});

gulp.task('watch:source', async () => {
  console.log(`Watching for changes to the Node.js server JavaScript...`);
  gulp.watch('server/src/**/*.js', gulp.series('build:server'));
});

gulp.task('watch:server', async () => {
  console.log(`Starting the Node.js server and watching for changes...`);
  // Run nodemon in a separate process to isolate its side effects on stdio streams
  child_process.fork(
    'node_modules/.bin/nodemon',
    ['--watch', 'server/build', '--inspect=:9311', '.'],
    { stdio: 'inherit' }
  );
});

gulp.task(
  'watch',
  gulp.series(
    gulp.parallel('domain', 'build:server'),
    gulp.parallel('watch:source', 'watch:server')
  )
);

gulp.task('default', gulp.series('watch'));

function _spawnTask(command, args, options, done) {
  let subprocess = child_process.spawn(command, args, options);
  subprocess.on('error', error => done(error));
  subprocess.on('exit', (code, signal) => {
    if (code === 0) {
      done(null);
    } else {
      let commandString = [command, ...args].join(' ');
      let error =
        code !== null
          ? new Error(`"${commandString}" exited with code ${code}`)
          : new Error(`"${commandString}" was terminated by a ${signal} signal`);
      done(error);
    }
  });
}
