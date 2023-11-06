// source :https://github.com/tugraz-isds/respvis/blob/master/gulp-tasks/bundleDeclaration.js

const rollup = require("rollup");
const dts = require("rollup-plugin-dts");

async function bundleDeclaration() {
  const bundle = await rollup.rollup({
    input: './package/esm/types/index.d.ts',
    plugins: [dts.default()]
  });
  await bundle.write({
    file: './package/index.d.ts',
    format: "esm"
  })
}

module.exports = {
  bundleDeclaration
}
