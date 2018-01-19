import buble from 'rollup-plugin-buble';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';
import uglify from 'rollup-plugin-uglify';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/app.js',
  output: {
    sourcemap: true,
    format: 'iife',
    file: 'dist/app.js'
  },
  name: 'app',
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file — better for performance
      /*css: css => {
        css.write('dist/bundle.css');
      },*/

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
    production && uglify()
  ]
};
