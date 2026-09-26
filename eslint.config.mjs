import eslint from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["dist/", "services/"] },

  eslint.configs.recommended,
  ...svelte.configs.recommended,
  prettierConfig,

  {
    rules: {
      // The lists are replaced as a whole whenever a feed is loaded, so keys
      // would only repeat the index, which is what Svelte uses without them
      "svelte/require-each-key": "off"
    }
  },

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
    files: [
      "rollup.config.js",
      "eslint.config.mjs",
      "tests/**/*.js",
      "scripts/**/*.mjs"
    ],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
