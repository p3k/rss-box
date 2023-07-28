// This is the entrypoint for embedded box scripts
// All it does is to once load the framework which does the actual work

//import "core-js";

import { urls } from "./urls";
import { version } from "../package.json";
import polyfill from "./polyfill.io";

const id = `__rssbox_viewer_${version.replace(/\D/g, "_")}_init__`;

if (!window[id]) {
  window[id] = true;

  polyfill(() => {
    const script = document.createElement("script");
    script.defer = script.async = true;
    script.src = urls.app + "/box.js";
    document.head.appendChild(script);
  });
}
