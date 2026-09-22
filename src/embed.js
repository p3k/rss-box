// Helpers of the embed script (`box.js`), kept apart so they can be tested

const getNativeValue = value => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
};

// The address of a page is written by whoever links to it, so a malformed
// escape sequence must not cost the boxes of the page; it stays as it is
const decode = value => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// The settings in the address of the script: everything after the first `?`,
// even if there are more of them (e.g. in an URL that has not been encoded),
// except for a fragment
export const getQueryOf = url => {
  const [address] = url.split("#");
  const index = address.indexOf("?");

  return index < 0 ? "" : address.slice(index + 1);
};

// Only the given keys are taken. Everything after the first `=` is the value,
// even if it contains one (e.g. an URL that has not been encoded); a key without
// `=` has no value. Pass the `reduce` of an untouched array for pages whose
// libraries extend the native ones.
export const parseQuery = (query, keys, reduce = Array.prototype.reduce) =>
  reduce.call(
    query.split("&"),
    (data, pair) => {
      const index = pair.indexOf("=");
      const key = index < 0 ? pair : pair.slice(0, index);

      if (keys.indexOf(key) > -1) {
        data[key] = getNativeValue(
          index < 0 ? "" : decode(pair.slice(index + 1))
        );
      }

      return data;
    },
    {}
  );

// The URL to tell the referrer service about the page a box has been embedded
// in and about the feeds it shows. The fragment is left out: it is never sent
// to a server otherwise and often holds something personal.
export const getPingUrl = (referrersUrl, pageUrl, feedUrls) => {
  const metadata = JSON.stringify({ feedUrls });

  return `${referrersUrl}&url=${encodeURIComponent(
    pageUrl.split("#")[0]
  )}&metadata=${encodeURIComponent(metadata)}`;
};
