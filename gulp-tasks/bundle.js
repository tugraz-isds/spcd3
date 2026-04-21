const path = require("path");
const rollup = require("rollup");
const rollupCommonJs = require("@rollup/plugin-commonjs");
const rollupTypeScript = require("@rollup/plugin-typescript");
const { default: rollupNodeResolve } = require("@rollup/plugin-node-resolve");
const terser = require("@rollup/plugin-terser");
const fs = require("fs");
const zlib = require("zlib");

function gzipFile(file) {
  const source = fs.readFileSync(file);
  fs.writeFileSync(`${file}.gz`, zlib.gzipSync(source));
}

function ignoreCssImports() {
  return {
    name: "ignore-css-imports",
    load(id) {
      if (id.endsWith(".css")) {
        return 'export default undefined;';
      }
      return null;
    },
  };
}

async function bundle() {
  const build = await rollup.rollup({
    input: path.resolve(process.cwd(), "src/lib/index.ts"),
    plugins: [
      rollupNodeResolve({ browser: true }),
      rollupCommonJs(),
      rollupTypeScript({
        tsconfig: path.resolve(process.cwd(), "tsconfig.json"),
        compilerOptions: {
          declaration: false,
          declarationDir: undefined,
        },
      }),
      ignoreCssImports(),
    ],
  });

  const minPlugins = [terser()];

  async function writeLib(format) {
    const location = path.resolve(process.cwd(), `dist/library/${format}`);
    const formatString =
      format === "iife"
        ? "IIFE"
        : format === "esm"
          ? "ESM"
          : format === "cjs"
            ? "CommonJS"
            : "";
    const config = [
      { extension: "js", plugins: [], sourcemap: true, gzip: true },
      { extension: "min.js", plugins: minPlugins, sourcemap: false, gzip: true },
    ];

    for (const conf of config) {
      const file = path.join(location, `spcd3.${conf.extension}`);

      await build.write({
        file,
        format: format === "esm" ? "es" : format,
        name: "spcd3",
        plugins: conf.plugins,
        sourcemap: conf.sourcemap,
        banner: `// SPCD3 version 1.0.0 ${formatString}`,
      });

      if (!fs.existsSync(file)) {
        throw new Error(`Expected output file was not created: ${file}`);
      }

      if (conf.gzip) {
        gzipFile(file);
      }
    }
  }

  await writeLib("esm");
  await writeLib("iife");
  await writeLib("cjs");
  await build.close();
}

module.exports = { bundle };
