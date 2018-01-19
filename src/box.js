import ready from 'domready';

import RssStore from './RssStore';
import Box from '../components/Box.html';
import { defaults, keys, urls } from './settings';
import polyfill from './polyfill.io';

ready(
  polyfill(() => {
    const getNativeValue = value => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    };

    const parseQuery = query => {
      const parts = query.split('&');
      return parts.reduce((data, pair) => {
        const [key, value] = pair.split('=');
        if (keys.indexOf(key) > -1) {
          data[key] = getNativeValue(decodeURIComponent(value));
        }
        return data;
      }, {});
    };

    const search = urls.app;
    const scripts = Array.apply(null, document.querySelectorAll('script[src*="' + search + '"]'));

    scripts.forEach(script => {
      const query = script.src.split('?')[1];
      if (!query) return;

      let data = parseQuery(query);

      if (!data.url) data.url = urls.default;
      data = Object.assign({}, defaults, data);

      const store = new RssStore();
      store.set(data);

      const parent = script.parentNode;
      const container = document.createElement('div');
      parent.insertBefore(container, script);

      void new Box({
        target: container,
        store
      });

      // Only for IE11
      script.parentNode.removeChild(script);
    });

    if (location.href.indexOf(urls.app) < 0) {
      fetch(urls.referrers + '&url=' + encodeURIComponent(location.href));
    }
  })
);
