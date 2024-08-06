// This is the entrypoint for embedded box scripts
// All it does is to once load the framework which does the actual work

import { urls } from "./urls";
import { version } from "../package.json";

const id = `__rssbox_viewer_${version.replace(/\D/g, "_")}_init__`;

if (!window[id]) {
  window[id] = true;

  const load = (filename, callback) => {
    const script = document.createElement("script");
    script.async = script.defer = true;
    script.src = `${urls.app}/${filename}`;
    if (callback) {
      script.onload = callback;
    }
    document.head.appendChild(script);
  };

  // Target modern browsers and IE 11 differently
  // Source: <https://tanalin.com/en/articles/ie-version-js/>
  if (window.msCrypto) {
    load("polyfills", () => load("box.js"));
  } else {
    load("box-esm.js");
  };
}
