import ready from 'domready';

import RssStore from '../src/RssStore';
import Box from '../components/Box.html';
import { defaults, KEYS, URLS } from '../src/settings';

const getNativeValue = value => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const parseQuery = query => {
  const parts = query.split('&');
  return parts.reduce((data, pair) => {
    const [key, value] = pair.split('=');
    if (KEYS.indexOf(key) > -1) {
      data[key] = getNativeValue(decodeURIComponent(value));
    }
    return data;
  }, {});
};

ready(() => {
  const re = new RegExp(URLS.base);
  const filter = Array.prototype.filter;
  const scripts = filter.call(document.scripts, script => script.src && script.src.match(re));

  scripts.forEach(script => {
    const query = script.src.split(re)[1].substr(1);
    let data = parseQuery(query);

    data = Object.assign({}, defaults, data);

    const store = new RssStore(data.url);
    store.set(data);

    const parent = script.parentNode;
    const container = document.createElement('div');
    parent.insertBefore(container, script);

    void new Box({
      target: container,
      store
    });

    script.remove();
  });
});
