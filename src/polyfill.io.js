export default callback => {
  const features = ['fetch', 'Object.assign', 'Promise', 'String.prototype.padStart'];

  const script = document.createElement('script');
  script.src = 'https://cdn.polyfill.io/v2/polyfill.min.js?features=' + features.join();
  script.defer = script.async = true;
  script.onload = callback;
  document.head.appendChild(script);
};
