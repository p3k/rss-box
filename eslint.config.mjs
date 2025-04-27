import eslint from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  eslint.configs.recommended,
  ...svelte.configs.recommended,
  prettierConfig,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es6
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    }
  },

  {
    files: ["rollup.config.js", "eslint.config.mjs"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
