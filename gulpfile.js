const {src, dest, series} = require('gulp');
const del = require('del');
const { bundleJS } = require("./gulp-tasks/bundleJS");
const { bundleDeclaration } = require("./gulp-tasks/bundleDeclaration");
const {watcher} = require("./gulp-tasks/watcher");
const svgSprite = require('gulp-svg-sprite');
const base64 = require('gulp-base64-inline');


function cleanDistFolder() {
    return del('dist', {force: true});
}

function deleteTypesFolder() {
    return del('./dist/example/lib/types', {force: true});
}

function copyExampleFolder() {
    return src('./src/example/**/*').pipe(dest('./dist/example'));
}

const config = {
    mode: {
        css: {
            render: {
            css: true,
            sprite: 'src.svg',
            }
        },
        defs: true,
        symbol: true,
    }
}
  
function createSVGs() {
    return src('./src/lib/svg/*.svg')
    .pipe(svgSprite(config))
    .pipe(dest('./dist/example/svgtest'));
}

function convertToBase64() {
    return src('./src/lib/svg/*.svg')
        .pipe(base64('./dist/example/svg'))
        .pipe(dest('./dist/example/svg'));
}


exports.clean = cleanDistFolder;

exports.build = series(cleanDistFolder, copyExampleFolder, convertToBase64, bundleJS, bundleDeclaration, deleteTypesFolder);

exports.serve = series(exports.build, watcher)