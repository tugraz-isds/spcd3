const { src, dest, series, parallel } = require("gulp");
const del = require("del");
const { bundle } = require("./gulp-tasks/bundle");
const { watcher } = require("./gulp-tasks/watch");
const { tauriBuild } = require("./gulp-tasks/tauri");
const { generateIcons } = require("./gulp-tasks/generate-icons");
const path = require("path");
const fs = require("fs");
const ts = require("gulp-typescript");

const tsProject = ts.createProject("tsconfig.json");

function buildExampleTS() {
  return src("./src/example/**/*.ts").pipe(tsProject()).pipe(dest("./dist/example"));
}

function cleanDistFolder() {
  return del("dist", { force: true });
}

function cleanNodeModules() {
  return del("node_modules", { force: true });
}

function cleanPackageLock() {
  return del("yarn-lock.json", { force: true });
}

function cleanPackage() {
  return del("package", { force: true });
}

function copyExampleFolder() {
  return src(["./src/example/**/*", "!./src/example/**/*.ts"]).pipe(
    dest("./dist/example"),
  );
}

function copyLibFileToExample() {
  const sourceFile = path.resolve(__dirname, "./dist/library/esm/spcd3.js");
  const targetDir = path.resolve(__dirname, "./dist/example/lib/");

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Source file not found: ${sourceFile}`);
  }

  return src(sourceFile).pipe(dest(targetDir));
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
  buildExampleTS,
  copyExampleFolder,
  bundle,
  copyLibFileToExample,
);

exports.dev = series(exports.build, watcher);

exports.tauri = tauriBuild;
