// source: https://github.com/tugraz-isds/respvis/blob/master/gulp-tasks/bundleJS.js

const rollup = require("rollup");
const rollupCommonJs = require("@rollup/plugin-commonjs");
const rollupTypescript = require("@rollup/plugin-typescript");
const {default: rollupNodeResolve} = require("@rollup/plugin-node-resolve");
const {terser: rollupTerser} = require("rollup-plugin-terser");
const {default: rollupGzip} = require("rollup-plugin-gzip");
const fs = require("fs");


async function bundleJS() {
  const bundle = await rollup.rollup({
    input: './src/index.ts',
    plugins: [
      rollupNodeResolve({ browser: true }),
      rollupCommonJs(),
      rollupTypescript({ tsconfig: './tsconfig.json' })
    ]
  });

  const minPlugins = [rollupTerser()];
  const gzPlugins = [rollupTerser(), rollupGzip()];

  function write(format) {
    const location = `./package/${format}`;
    const writeConfigurationsIIFE = [
      { extension: 'js', plugins: [] },
      { extension: 'min.js', plugins: minPlugins },
      { extension: 'min.js', plugins: gzPlugins },
    ];
    return writeConfigurationsIIFE.map((c) => bundle.write({
      file:`${location}/spc.${c.extension}`,
      format,
      name: 'spc',
      plugins: c.plugins,
      sourcemap: true,
    }).then(() => {
      const fileData = fs.readFileSync(`${location}/spc.${c.extension}`, 'utf8');
      const formatString = format === 'iife' ? 'IIFE' :
        format === 'esm' ? 'ESM' :
          format === 'cjs' ? 'CommonJS' : ''
      const dataWithHeaderLine = `// SPCD3 version 1.0.0 ${formatString}\n` + fileData
      fs.writeFileSync(`${location}/spc.${c.extension}`, dataWithHeaderLine, 'utf8');
    }))
  }

  const mode = 'production';
  return Promise.all([
    ...write('esm'),
    ...((mode === 'production') ? [write('iife'), write('cjs')] : [])
  ])
}

module.exports = { bundleJS }