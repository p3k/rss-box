// This is the entrypoint for embedded box scripts
// All it does is to once load the framework which does the actual work

import { urls } from "./urls";
import { version } from "../package.json";
import polyfill from "./polyfill.io";

const id = `__rssbox_viewer_${version.replace(/\D/g, "_")}_init__`;

if (!window[id]) {
  window[id] = true;

  polyfill(() => {
    // Target modern browsers and IE 11 differently
    // Source: <https://tanalin.com/en/articles/ie-version-js/>
    const filename = window.msCrypto ? "box.js" : "box-esm.js";
    const script = document.createElement("script");
    script.async = script.defer = true;
    script.src = `${urls.app}/${filename}`;
    document.head.appendChild(script);
  });
}
