import callback from '../src/version';

export default () => {
  const polyfills = document.createElement('script');
  polyfills.src = 'https://cdn.polyfill.io/v2/polyfill.min.js?features=Promise,fetch,String.prototype.padStart&callback=' + callback;
  polyfills.defer = polyfills.async = true;
  document.body.appendChild(polyfills);
};
