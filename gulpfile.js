const { src, dest, series, parallel } = require("gulp");
const { deleteAsync } = require("del");
const { bundle } = require("./gulp-tasks/bundle");
const { watcher } = require("./gulp-tasks/watch");
const { tauriBuild } = require("./gulp-tasks/tauri");
const { generateIcons } = require("./gulp-tasks/generate-icons");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const ts = require("gulp-typescript");

const tsProject = ts.createProject("tsconfig.json");
const typesProject = ts.createProject("tsconfig.json", {
  declaration: true,
  emitDeclarationOnly: true,
  declarationDir: "./dist/library",
  outDir: "./dist/library",
  rootDir: "./src/lib",
  sourceMap: false,
});

function buildExampleTS() {
  return src("./src/example/**/*.ts")
    .pipe(tsProject())
    .pipe(dest("./dist/example"));
}

function buildLibraryTypes() {
  return src("./src/lib/index.ts")
    .pipe(typesProject())
    .dts.pipe(dest("./dist/library"));
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
  const styleFiles = [
    path.resolve(__dirname, "./src/lib/reset.css"),
    path.resolve(__dirname, "./src/lib/stylesheet.css"),
  ];
  const targetDir = path.resolve(__dirname, "./dist/library");
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

function cleanDistFolder() {
  return deleteAsync("dist", { force: true });
}

function cleanNodeModules() {
  return deleteAsync("node_modules", { force: true });
}

function cleanPackageLock() {
  return deleteAsync("yarn.lock", { force: true });
}

function cleanPackage() {
  return deleteAsync("package", { force: true });
}

function copyExampleFolder() {
  return src(["./src/example/**/*", "!./src/example/**/*.ts"]).pipe(
    dest("./dist/example"),
  );
}

function copyLibFileToExample() {
  const sourceFiles = [
    path.resolve(__dirname, "./dist/library/esm/spcd3.js"),
    path.resolve(__dirname, "./dist/library/spcd3.css"),
  ];
  const targetDir = path.resolve(__dirname, "./dist/example/lib/");

  for (const sourceFile of sourceFiles) {
    if (!fs.existsSync(sourceFile)) {
      throw new Error(`Source file not found: ${sourceFile}`);
    }
  }

  return src(sourceFiles).pipe(dest(targetDir));
}

exports.clean = cleanDistFolder;
exports.icons = generateIcons;

exports.cleanAll = parallel(
  cleanDistFolder,
  cleanNodeModules,
  cleanPackageLock,
  cleanPackage,
);

exports.build = series(
  cleanDistFolder,
  generateIcons,
  buildLibraryTypes,
  buildLibraryStyles,
  buildExampleTS,
  copyExampleFolder,
  bundle,
  copyLibFileToExample,
);

exports.dev = series(exports.build, watcher);

exports.tauri = tauriBuild;
