const { src, dest, watch, series } = require("gulp");
const bs = require("browser-sync").create();
const { bundle } = require("./bundle");
const fs = require("fs");
const path = require("path");
const ts = require("gulp-typescript");
const zlib = require("zlib");

const tsProject = ts.createProject("tsconfig.json");

function buildExampleTS() {
  return src("./src/example/**/*.ts").pipe(tsProject()).pipe(dest("./dist/example"));
}

function copyExampleFolder() {
  return src(["./src/example/**/*", "!./src/example/**/*.ts"]).pipe(
    dest("./dist/example"),
  );
}

function copyLibFileToExample() {
  return src(["./dist/library/esm/spcd3.js", "./dist/library/spcd3.css"]).pipe(
    dest("./dist/example/lib/"),
  );
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function buildLibraryStyles(done) {
  const rootDir = path.resolve(__dirname, "..");
  const styleFiles = [
    path.resolve(rootDir, "./src/lib/reset.css"),
    path.resolve(rootDir, "./src/lib/stylesheet.css"),
  ];
  const targetDir = path.resolve(rootDir, "./dist/library");
  const targetFile = path.resolve(targetDir, "spcd3.css");
  const targetGzipFile = path.resolve(targetDir, "spcd3.css.gz");
  const targetMinFile = path.resolve(targetDir, "spcd3.min.css");
  const targetMinGzipFile = path.resolve(targetDir, "spcd3.min.gz.css");

  const css = `${styleFiles.map((file) => fs.readFileSync(file, "utf8").trim()).join("\n\n")}\n`;
  const minifiedCss = `${minifyCss(css)}\n`;

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, css, "utf8");
  fs.writeFileSync(targetGzipFile, zlib.gzipSync(Buffer.from(css, "utf8")));
  fs.writeFileSync(targetMinFile, minifiedCss, "utf8");
  fs.writeFileSync(
    targetMinGzipFile,
    zlib.gzipSync(Buffer.from(minifiedCss, "utf8")),
  );
  done();
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
  watch("src/lib/**/*.css", series(buildLibraryStyles, copyLibFileToExample, reload));
  watch("src/example/**/*", series(buildExampleTS, copyExampleFolder, reload));
}

module.exports = { watcher };
