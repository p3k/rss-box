import buble from '@rollup/plugin-buble';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
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
  replace({ __BUILD_MODE__: production ? 'prod' : 'dev' }),
  svelte({ dev: !production }),
  resolve(),
  commonjs(),
  json(),
  production && buble(),
  production && terser()
];

export default [config('app'), config('main'), config('box')];
