(function () {
  'use strict';

  const urls$1 = {};

  const baseUrl = "http://localhost";

  const urls = {
    app: baseUrl + ":8000",
    proxy: baseUrl + ":8000/roxy",
    referrers: baseUrl + ":8000/ferris?group=rss-box",
    feed: "https://blog.p3k.org/stories.xml"
  };

  Object.keys(urls$1).forEach(key => {
    if (key in urls) urls[key] = urls$1[key];
  });

  var version = "21.12.11";

  var polyfill = callback => {

    const features = [
      "fetch",
      "Object.assign",
      "Promise",
      "String.prototype.padStart",
      "String.prototype.startsWith",
      "Array.prototype.fill",
      "Array.from"
    ];

    const script = document.createElement("script");
    script.src = "https://cdn.polyfill.io/v3/polyfill.min.js?flags=gated&features=" + encodeURIComponent(features.join());
    script.crossOrigin = "anonymous";
    script.onload = callback;

    document.head.appendChild(script);
  };

  // This is the entrypoint for embedded box scripts

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

})();
//# sourceMappingURL=main.js.map
