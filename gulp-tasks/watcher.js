// source: https://github.com/tugraz-isds/respvis/blob/master/gulp-tasks/watcher.js

const gulp = require("gulp");
const browserSync = require('browser-sync').create();
const {bundleJS} = require("./bundleJS");

function reloadBrowser(cb) {
    browserSync.reload();
    cb();
}
function watcher(cb) {
    browserSync.init({
        server: './example',
        startPath: '/',
    });

    const watchOptions = { ignoreInitial: true };
    gulp.watch('/src/scripts/**/*', watchOptions,
        gulp.series(bundleJS, reloadBrowser));

    cb()
}

module.exports = {
    watcher
}