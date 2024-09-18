const rollup = require("rollup");
const rollupCommonJs = require("@rollup/plugin-commonjs");
const rollupTypeScript = require("@rollup/plugin-typescript");
const {default: rollupNodeResolve} = require("@rollup/plugin-node-resolve");
const {terser: rollupTerser} = require("rollup-plugin-terser");
const {default: rollupGzip} = require("rollup-plugin-gzip");
const fs = require("fs");

async function bundle() {
  const bundle = await rollup.rollup({
    input: './src/lib/index.ts',
    plugins: [
      rollupNodeResolve({ browser: true }),
      rollupCommonJs(),
      rollupTypeScript({ tsconfig: './tsconfig.json' }),
    ],
    output: {
      preserveModules: true,
    }
  });

  const minPlugins = [rollupTerser()];
  const gZipPlugins = [rollupTerser(), rollupGzip()];

  function writeLib(format) {
    const location = `./dist/library/${format}`;
    const config = [
      { extension: 'js', plugins: [] },
      { extension: 'min.js', plugins: minPlugins },
      { extension: 'min.js', plugins: gZipPlugins },
    ];
    return config.map((conf) => bundle.write({
      file:`${location}/spcd3.${conf.extension}`,
      format,
      name: 'spcd3',
      plugins: conf.plugins,
      sourcemap: true,
    }).then(() => {
      const fileData = fs.readFileSync(`${location}/spcd3.${conf.extension}`, 'utf8');
      const formatString = format === 'iife' ? 'IIFE' : format === 'esm' ? 'ESM' : format === 'cjs' ? 'CommonJS' : '';
      const dataWithHeaderLine = `// SPCD3 version 2.0.0 ${formatString}\n` + fileData;
      fs.writeFileSync(`${location}/spcd3.${conf.extension}`, dataWithHeaderLine, 'utf8');
    }))
  }

  function writeLibToExample() {
    const format = 'esm';
    const location = `./dist/example/lib`;
    const config = [
      { extension: 'js' }
    ];
   
    return config.map((conf) => bundle.write({
      file:`${location}/spcd3.${conf.extension}`,
      name: 'spcd3',
      format,
      sourcemap: true,
    }).then(() => {
      const fileData = fs.readFileSync(`${location}/spcd3.${conf.extension}`, 'utf8');
      const dataWithHeaderLine = `// SPCD3 version 2.0.0 ${format}\n` + fileData;
      fs.writeFileSync(`${location}/spcd3.${conf.extension}`, dataWithHeaderLine, 'utf8');
    }))
  }

  return Promise.all([
      ...writeLibToExample(),
      ...writeLib('esm'),
      ...writeLib('iife'),
      ...writeLib('cjs')])
}

module.exports = {bundle}