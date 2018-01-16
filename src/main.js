// This is the entrypoint for embedded box scripts
// All it does is to once load the framework which does the actual work

import { urls } from './settings';
import id from './version';

if (!window[id]) {
  window[id] = true;
  const script = document.createElement('script');
  script.defer = script.async = true;
  script.src = urls.base + '/box.js';
  document.body.appendChild(script);
}
