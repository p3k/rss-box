// Source: <https://github.com/MitzaCoder/svelte-boilerplate/blob/ee26b937fb996e2bca5e325b35c27505f5a413da/rollup.config.js>

import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

import svelte from "rollup-plugin-svelte";

const production = !process.env.ROLLUP_WATCH;

const config = name => {
  return {
    input: `src/${name}.js`,
    output: {
      name,
      sourcemap: true,
      format: "iife",
      file: `dist/${name}.js`,
      inlineDynamicImports: true
    },
    plugins: plugins()
  };
};

const plugins = () => [
  replace({
    __BUILD_MODE__: production ? "prod" : "dev",
    preventAssignment: false
  }),

  svelte({
    compilerOptions: { dev: !production },
    emitCss: false
  }),

  resolve({
    browser: true,
    dedupe: ["svelte"]
  }),

  commonjs(),
  json(),

  production &&
    babel({
      babelHelpers: "bundled",
      exclude: ["node_modules/@babel/**", "node_modules/core-js/**"],
      extensions: [".js", ".mjs", ".html", ".svelte"],
      presets: [
        [
          "@babel/preset-env",
          {
            corejs: "3.31.1",
            targets: "> 0.25%, not dead, IE 11",
            useBuiltIns: "usage"
          }
        ]
      ]
    }),

  production &&
    terser({
      sourceMap: { url: "inline" }
    })
];

export default [
  config("app"),
  config("box"),
  config("main"),
  config("polyfill.io")
];
