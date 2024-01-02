const {src, dest, series} = require('gulp');
const del = require('del');
const { bundleJS } = require("./gulp-tasks/bundleJS");
const { bundleDeclaration } = require("./gulp-tasks/bundleDeclaration");
const {watcher} = require("./gulp-tasks/watcher");

function cleanDistFolder() {
    return del('dist', {force: true});
}

function copyExampleFolder() {
    return src('./src/example/**/*').pipe(dest('./dist/example'));
}

exports.clean = cleanDistFolder;

exports.build = series(cleanDistFolder, copyExampleFolder, bundleJS, bundleDeclaration);

exports.serve = series(exports.build, watcher)