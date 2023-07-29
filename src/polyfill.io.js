let loaded = false;

export default callback => {
  if (loaded) return;

  const polyfillUrl =
    "https://cdn.polyfill.io/v3/polyfill.min.js?version=3.111.0&features=";

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
  script.src = `${polyfillUrl}${encodeURIComponent(features.join())}`;
  script.crossOrigin = "anonymous";
  script.onload = callback;
  document.head.appendChild(script);

  loaded = true;
};
