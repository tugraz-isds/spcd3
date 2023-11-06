const {series} = require('gulp');
const del = require('del');
const { bundleJS } = require("./gulp-tasks/bundleJS");
const { bundleDeclaration } = require("./gulp-tasks/bundleDeclaration");

function cleanPackage() {
    return del('package', {force: true});
}

exports.clean = cleanPackage;

exports.build = series(bundleJS, bundleDeclaration);