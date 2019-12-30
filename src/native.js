// Retrieve native objects without any extensions (e.g. by PrototypeJS)
export default function getNativeObject(native) {
  var iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  var retrieved = iframe.contentWindow[native];
  document.body.removeChild(iframe);
  return retrieved;
}
