this.polyfill = this.polyfill || {};
this.polyfill.io = (function () {
  'use strict';

  function polyfill_io (callback) {

    var features = [
      'fetch',
      'Object.assign',
      'Promise',
      'String.prototype.padStart',
      'String.prototype.startsWith',
      'Array.prototype.fill',
      'Array.from'
    ];

    var script = document.createElement('script');
    script.src = 'https://cdn.polyfill.io/v3/polyfill.min.js?flags=gated&features=' + encodeURIComponent(features.join());
    script.crossOrigin = 'anonymous';
    script.onload = callback;

    document.head.appendChild(script);
  }

  return polyfill_io;

}());
//# sourceMappingURL=polyfill.io.js.map
