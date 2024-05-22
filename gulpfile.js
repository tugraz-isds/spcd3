const {src, dest, series, parallel} = require('gulp');
const del = require('del');
const { bundle } = require("./gulp-tasks/bundle");
const {watch} = require("./gulp-tasks/watch");

function cleanDistFolder() {
    return del('dist', {force: true});
}

function cleanNodeModules() {
    return del('node_modules', {force: true});
}

function cleanPackageLock() {
    return del('package-lock.json', {force: true});
}

function deleteTypesFolder() {
    return del('./dist/example/lib/types', {force: true});
}

function deleteSourceMap() {
    return del('./dist/example/lib/spcd3.js.map', {force: true})
}

function copyExampleFolder() {
    return src('./src/example/**/*').pipe(dest('./dist/example'));
}

exports.clean = cleanDistFolder;

exports.cleanAll = parallel(cleanDistFolder, cleanNodeModules, cleanPackageLock);

exports.build = series(cleanDistFolder, copyExampleFolder, bundle, deleteTypesFolder, deleteSourceMap);

exports.serve = series(exports.build, watch);