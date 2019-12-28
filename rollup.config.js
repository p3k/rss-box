import buble from '@rollup/plugin-buble';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';

import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

const config = name => {
  return {
    input: `src/${name}.js`,
    output: {
      name: name,
      sourcemap: true,
      format: 'iife',
      file: `dist/${name}.js`
    },
    plugins: plugins()
  };
};

const plugins = () => [
  replace({
    __BUILD_MODE__: production ? 'prod' : 'dev'
  }),

  svelte({
    // enable run-time checks when not in production
    dev: !production,
    // this results in smaller CSS files
    cascade: false,
    store: true
  }),

  // If you have external dependencies installed from
  // npm, you'll most likely need these plugins. In
  // some cases you'll need additional configuration —
  // consult the documentation for details:
  // https://github.com/rollup/rollup-plugin-commonjs
  resolve(),
  commonjs(),

  json(),

  // If we're building for production (npm run build
  // instead of npm run dev), transpile and minify
  production && buble({ exclude: 'node_modules/**' }),
  production && terser()
];

export default [config('app'), config('main'), config('box')];
