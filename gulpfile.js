const {src, dest, task, series} = require('gulp');
var typescript = require('gulp-typescript');
const del = require('del');
const { bundleJS } = require("./gulp-tasks/bundleJS");
const { bundleDeclaration } = require("./gulp-tasks/bundleDeclaration");

function cleanPackage() {
    return del('package', {force: true});
}

exports.clean = cleanPackage;

exports.build = series(bundleJS, bundleDeclaration);

// temp
exports.compile = task('compile', async function(){
    src('src/scripts/*.ts')
        .pipe(typescript())
        .pipe(dest('example/lib/'));
});