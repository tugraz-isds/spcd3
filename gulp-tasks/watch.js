const {src, dest, watch, series } = require('gulp');
const bs = require("browser-sync").create();
const { bundle } = require("./bundle");

function copyExampleFolder() {
    return src('./src/example/**/*').pipe(dest('./dist/example'));
}

function copyLibFileToExample() {
    return src('./dist/library/esm/spcd3.js').pipe(dest('./dist/example/lib/'));
}

function reload(done) {
  bs.reload();
  done();
}

function watcher() {
  bs.init({
    server: "./dist/example",
    open: false,
    notify: false,
  });

  watch("src/lib/**/*.{ts,js}", series(bundle, copyLibFileToExample, reload));
  watch("src/example/**/*", series(copyExampleFolder, reload));
}

module.exports = {watcher}