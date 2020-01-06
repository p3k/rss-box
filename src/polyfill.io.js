let loaded = false;

export default callback => {
  if (loaded) return;

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
