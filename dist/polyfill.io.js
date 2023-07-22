this.polyfill = this.polyfill || {};
this.polyfill.io = (function () {
  'use strict';

  var polyfill_io = callback => {

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

  return polyfill_io;

})();
//# sourceMappingURL=polyfill.io.js.map
