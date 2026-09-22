// Preloaded via `node --import` (see the `test` script)

import { register } from "node:module";

// Dates without an explicit time zone are parsed as local time
process.env.TZ = "UTC";

register("./hooks.js", import.meta.url);
