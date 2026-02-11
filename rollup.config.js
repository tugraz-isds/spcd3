import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';

export default {
  input: "src/lib/index.ts",
  output: {
    file: "dist/example/lib/spcd3.js",
    format: "es",
    sourcemap: true
  },
  plugins: [
    commonjs(),
    postcss({
      extract: true,
      minimize: false,
      sourceMap: true,
    })
  ]
};