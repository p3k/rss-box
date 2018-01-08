// This is the entrypoint for embedded box scripts
// All it does is to once load the framework which does the actual work

import { urls } from './settings';

const LOADER = '__rssbox_viewer_framework__';

if (!window[LOADER]) {
  window[LOADER] = true;

  let script = document.createElement('script');
  script.src = urls.base + '/box.js';
  document.head.appendChild(script);
}
