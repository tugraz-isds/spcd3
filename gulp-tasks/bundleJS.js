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
      file:`${location}/spcd3.${c.extension}`,
      format,
      name: 'spcd3',
      plugins: c.plugins,
      sourcemap: true,
    }).then(() => {
      const fileData = fs.readFileSync(`${location}/spcd3.${c.extension}`, 'utf8');
      const formatString = format === 'iife' ? 'IIFE' :
        format === 'esm' ? 'ESM' :
          format === 'cjs' ? 'CommonJS' : ''
      const dataWithHeaderLine = `// SPCD3 version 1.0.0 ${formatString}\n` + fileData
      fs.writeFileSync(`${location}/spcd3.${c.extension}`, dataWithHeaderLine, 'utf8');
    }))
  }

  function writeLibToExample(format) {
    const location = `./example/lib/${format}`;
    const writeConfigurationsIIFE = [
      { extension: 'js', plugins: [] }
    ];
    return writeConfigurationsIIFE.map((c) => bundle.write({
      file:`${location}/spcd3.${c.extension}`,
      format,
      name: 'spcd3',
      plugins: c.plugins,
      sourcemap: true,
    }).then(() => {
      const fileData = fs.readFileSync(`${location}/spcd3.${c.extension}`, 'utf8');
      const formatString = format === 'iife' ? 'IIFE' :
          format === 'esm' ? 'ESM' :
              format === 'cjs' ? 'CommonJS' : ''
      const dataWithHeaderLine = `// SPCD3 version 1.0.0 ${formatString}\n` + fileData
      fs.writeFileSync(`${location}/spcd3.${c.extension}`, dataWithHeaderLine, 'utf8');
    }))
  }

  //TODO: change mode
  const mode = 'production';
  return Promise.all([
      ...writeLibToExample('cjs'),
      ...write('esm'),
      ...((mode === 'production') ? [write('iife'), write('cjs')] : [])
  ])
}

module.exports = { bundleJS }