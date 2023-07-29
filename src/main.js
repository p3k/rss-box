// This is the entrypoint for embedded box scripts
// All it does is to once load the framework which does the actual work

import { urls } from "./urls";
import { version } from "../package.json";

const id = `__rssbox_viewer_${version.replace(/\D/g, "_")}_init__`;

if (!window[id]) {
  window[id] = true;

  let filename = "box.js";

  // Load the polyfills for IE 11
  // Source: <https://tanalin.com/en/articles/ie-version-js/>
  if (window.msCrypto) {
    const script = document.createElement("script");
    script.async = script.defer = false;
    script.src = `${urls.app}/polyfill.io.js`;
    document.head.appendChild(script);
  } else {
    filename = "box-esm.js";
  }

  const script = document.createElement("script");
  script.async = script.defer = true;
  script.src = `${urls.app}/${filename}`;
  document.head.appendChild(script);
}
