const path = require("path");
const rollup = require("rollup");
const rollupCommonJs = require("@rollup/plugin-commonjs");
const rollupTypeScript = require("@rollup/plugin-typescript");
const postcss = require("rollup-plugin-postcss");
const { default: rollupNodeResolve } = require("@rollup/plugin-node-resolve");
const { terser: rollupTerser } = require("rollup-plugin-terser");
const { default: rollupGzip } = require("rollup-plugin-gzip");
const fs = require("fs");

async function bundle() {
  const build = await rollup.rollup({
    input: path.resolve(process.cwd(), "src/lib/index.ts"),
    plugins: [
      rollupNodeResolve({ browser: true }),
      rollupCommonJs(),
      rollupTypeScript({
        tsconfig: path.resolve(process.cwd(), "tsconfig.json"),
      }),
      postcss({ extract: false }),
    ],
  });

  const minPlugins = [rollupTerser()];
  const gZipPlugins = [rollupTerser(), rollupGzip()];

  async function writeLib(format) {
    const location = path.resolve(process.cwd(), `dist/library/${format}`);
    const config = [
      { extension: "js", plugins: [] },
      { extension: "min.js", plugins: minPlugins },
      { extension: "gz.js", plugins: gZipPlugins },
    ];

    for (const conf of config) {
      const file = path.join(location, `spcd3.${conf.extension}`);

      await build.write({
        file,
        format: format === "esm" ? "es" : format,
        name: "spcd3",
        plugins: conf.plugins,
        sourcemap: true,
      });

      if (!fs.existsSync(file)) {
        throw new Error(`Expected output file was not created: ${file}`);
      }

      const fileData = fs.readFileSync(file, "utf8");
      const formatString =
        format === "iife"
          ? "IIFE"
          : format === "esm"
            ? "ESM"
            : format === "cjs"
              ? "CommonJS"
              : "";

      fs.writeFileSync(
        file,
        `// SPCD3 version 1.0.0 ${formatString}\n${fileData}`,
        "utf8",
      );
    }
  }

  await writeLib("esm");
  await writeLib("iife");
  await writeLib("cjs");
  await build.close();
}

module.exports = { bundle };
