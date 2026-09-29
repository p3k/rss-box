// Module hooks that let Node load the sources the way the bundler sees them:
// - extensionless relative imports like `./error`
// - named imports from JSON files like `import { version } from "../package.json"`
// - `local.json`/`src/environment.js`, generated per installation or by CI
//   and must not influence the tests
// - Svelte components, compiled for the DOM like the Rollup plugin does

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { compile } from "svelte/compiler";

const EMPTY_ENVIRONMENT = "data:text/javascript,export const urls = {};";
const EMPTY_LOCAL = "data:text/javascript,export default {};";

export async function resolve(specifier, context, nextResolve) {
  const { parentURL } = context;

  if (parentURL && parentURL.endsWith("/src/urls.js")) {
    if (specifier === "./environment") {
      return { url: EMPTY_ENVIRONMENT, shortCircuit: true };
    }

    if (specifier === "../local.json") {
      return { url: EMPTY_LOCAL, shortCircuit: true };
    }
  }

  if (specifier.startsWith(".") && parentURL && !/\.\w+$/.test(specifier)) {
    const candidate = new URL(`${specifier}.js`, parentURL);

    if (existsSync(candidate)) {
      return nextResolve(candidate.href, context);
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    const data = JSON.parse(readFileSync(fileURLToPath(url), "utf8"));

    const namedExports = Object.keys(data)
      .filter(key => /^[A-Za-z_$][\w$]*$/.test(key))
      .map(key => `export const ${key} = data[${JSON.stringify(key)}];`);

    return {
      format: "module",
      shortCircuit: true,
      source: [
        `const data = ${JSON.stringify(data)};`,
        "export default data;",
        ...namedExports
      ].join("\n")
    };
  }

  if (url.endsWith(".svelte")) {
    const filename = fileURLToPath(url);

    const { js } = compile(readFileSync(filename, "utf8"), {
      filename,
      generate: "dom",
      css: "external"
    });

    return { format: "module", shortCircuit: true, source: js.code };
  }

  return nextLoad(url, context);
}
