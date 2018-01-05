import ready from 'domready';

import RssStore from '../src/RssStore';
import Box from '../components/Box.html';
import { defaults } from '../src/settings';

const getNativeValue = value => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const parseQuery = query => {
  let parts = query.split('&');
  return parts.reduce((data, pair) => {
    let [key, value] = pair.split('=');
    data[key] = getNativeValue(decodeURIComponent(value));
    return data;
  }, {});
};

ready(() => {
  let re = /https?:\/\/[^/]+\/main\.js/;
  let filter = Array.prototype.filter;
  let scripts = filter.call(document.scripts, script => script.src && script.src.match(re));

  scripts.forEach(script => {
    let query = script.src.split(re)[1].substr(1);
    let data = parseQuery(query);

    data = Object.assign({}, defaults, data);

    const store = new RssStore(data.url);
    store.set(data);

    let parent = script.parentNode;
    let container = document.createElement('div');
    parent.insertBefore(container, script);

    void new Box({
      target: container,
      store
    });

    script.remove();
  });
});
