(function () {
  'use strict';

  const urls = {};

  const baseUrl = 'http://localhost';

  const urls$1 = {
    app: baseUrl + ':8000',
    proxy: baseUrl + ':8001/roxy',
    referrers: baseUrl + ':8001/ferris?group=rssbox',
    feed: 'https://blog.p3k.org/stories.xml'
  };

  Object.keys(urls).forEach(key => {
    if (key in urls$1) urls$1[key] = urls[key];
  });

  var version = "20.01.06";

  var polyfill = callback => {

    const features = [
      'fetch',
      'Object.assign',
      'Promise',
      'String.prototype.padStart',
      'String.prototype.startsWith',
      'Array.prototype.fill',
      'Array.from'
    ];

    const script = document.createElement('script');
    script.src = 'https://cdn.polyfill.io/v3/polyfill.min.js?flags=gated&features=' + encodeURIComponent(features.join());
    script.crossOrigin = 'anonymous';
    script.onload = callback;

    document.head.appendChild(script);
  };

  // This is the entrypoint for embedded box scripts

  const id = `__rssbox_viewer_${version.replace(/\D/g, '_')}_init__`;

  if (!window[id]) {
    window[id] = true;

    polyfill(() => {
      const script = document.createElement('script');
      script.defer = script.async = true;
      script.src = urls$1.app + '/box.js';
      document.head.appendChild(script);
    });
  }

}());
//# sourceMappingURL=main.js.map
