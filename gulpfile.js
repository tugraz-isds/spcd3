const {src, dest, task, series, parallel} = require('gulp');
var typescript = require('gulp-typescript');
const del = require('del');
const { bundleJS } = require("./gulp-tasks/bundleJS");
const { bundleDeclaration } = require("./gulp-tasks/bundleDeclaration");
const {watcher} = require("./gulp-tasks/watcher");

function cleanPackage() {
    return del('package', {force: true});
}

function cleanExampleLib() {
    return del('example/lib/cjs', {force: true});
}

exports.clean = parallel(cleanPackage, cleanExampleLib);

exports.build = series(exports.clean, bundleJS, bundleDeclaration);

exports.serve = series(exports.build, watcher)

// temp
exports.compile = task('compile', async function(){
    src('src/scripts/*.ts')
        .pipe(typescript())
        .pipe(dest('example/lib/'));
});