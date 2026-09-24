// Source: <https://github.com/MitzaCoder/svelte-boilerplate/blob/ee26b937fb996e2bca5e325b35c27505f5a413da/rollup.config.js>

import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

import svelte from "rollup-plugin-svelte";

const production = !process.env.ROLLUP_WATCH;

const plugins = () => [
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
    terser({
      sourceMap: production || { url: "inline" }
    })
];

const config = (name, output) => {
  // polyfills.js is always loaded before any of the other IE11 bundles
  // (see index.html and main.js), so it's the only one that needs
  // useBuiltIns at all — "entry" here expands the broad core-js/stable
  // import in that file into everything the declared target lacks,
  // unconditionally, which is the right approach for a shared bootstrap
  // file. The other bundles would otherwise each independently detect
  // and re-inject their own copies of the same polyfills polyfills.js
  // already guarantees are in place by the time they run — pure
  // duplication, not additional coverage. Syntax transpilation (arrow
  // functions etc.) is controlled by `targets` below and happens either
  // way, regardless of useBuiltIns.
  const useBuiltIns = name === "polyfills" ? "entry" : false;

  return {
    input: `src/${name}.js`,
    output: {
      name,
      sourcemap: true,
      format: "iife",
      file: `dist/${output || name}.js`,
      inlineDynamicImports: true
    },
    plugins: [
      ...plugins(),

      babel({
        babelHelpers: "bundled",
        exclude: ["node_modules/@babel/**", "node_modules/core-js/**"],
        extensions: [".js", ".mjs", ".html", ".svelte"],
        presets: [
          [
            "@babel/preset-env",
            {
              // corejs only has an effect (and only warns otherwise) when
              // useBuiltIns isn't false
              ...(useBuiltIns && { corejs: "3.31.1" }),
              targets: "> 0.25%, not dead, IE 11",
              useBuiltIns
            }
          ]
        ]
      })
    ]
  };
};

const modern = (name, output) => {
  return {
    input: `src/${name}.js`,
    output: {
      name,
      sourcemap: true,
      format: "esm",
      file: `dist/${output || name}.js`
    },
    plugins: plugins()
  };
};

export default [
  config("app"),
  config("box"),
  modern("box", "box-esm"),
  config("main"),
  config("polyfills")
];
