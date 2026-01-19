const {src, dest, series, parallel} = require('gulp');
const del = require('del');
const {bundle} = require("./gulp-tasks/bundle");
const {watcher} = require("./gulp-tasks/watch");
const {tauriBuild} = require("./gulp-tasks/tauri");

function cleanDistFolder() {
    return del('dist', {force: true});
}

function cleanNodeModules() {
    return del('node_modules', {force: true});
}

function cleanPackageLock() {
    return del('yarn-lock.json', {force: true});
}

function copyExampleFolder() {
    return src('./src/example/**/*').pipe(dest('./dist/example'));
}

function copyLibFileToExample() {
    return src('./dist/library/esm/spcd3.js').pipe(dest('./dist/example/lib/'));
}

exports.clean = cleanDistFolder;

exports.cleanAll = parallel(cleanDistFolder, cleanNodeModules, cleanPackageLock);

exports.build = series(cleanDistFolder, copyExampleFolder, bundle, copyLibFileToExample);

exports.dev = series(exports.build, watcher);

exports.tauri = tauriBuild;