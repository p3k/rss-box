import ready from 'domready';

import { config, feed } from './stores';
import { urls } from './urls';
import polyfill from './polyfill.io';
import getNativeObject from './native.js';

import Box from '../components/Box.html';

// These are backwards-compatible settings
const defaults = {
  align: 'initial',
  boxFillColor: '#fff',
  compact: false,
  fontFace: 'inherit',
  frameColor: '#000',
  headless: false,
  height: '',
  linkColor: '',
  maxItems: 7,
  radius: 0,
  showXmlButton: false,
  textColor: '#000',
  titleBarColor: '#add8e6',
  titleBarTextColor: '#000',
  width: '200'
};

const keys = [...Object.keys(defaults), 'url'];

ready(
  polyfill(() => {
    const reduce = getNativeObject('Array').prototype.reduce;

    const getNativeValue = value => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    };

    const parseQuery = query => {
      const parts = query.split('&');
      return reduce.call(
        parts,
        (data, pair) => {
          const [key, value] = pair.split('=');
          if (keys.indexOf(key) > -1) {
            data[key] = getNativeValue(decodeURIComponent(value));
          }
          return data;
        },
        {}
      );
    };

    // Earlier versions used protocol-less URLs like `//p3k.org/rss`
    const search = urls.app.replace(/^https?:/, '');
    const scripts = Array.apply(null, document.querySelectorAll('script[src*="' + search + '"]'));

    scripts.forEach(script => {
      const query = script.src.split('?')[1];

      if (!query) return;

      let data = parseQuery(query);

      if (!data.url) data.url = urls.feed;

      data = Object.assign({}, defaults, data);

      config.set(data);
      feed.fetch(data.url);

      const parent = script.parentNode;
      const container = document.createElement('div');

      parent.insertBefore(container, script);

      void new Box({ target: container });

      // Only for IE11
      script.parentNode.removeChild(script);
    });

    if (location.href.indexOf(urls.app) < 0) {
      fetch(urls.referrers + '&url=' + encodeURIComponent(location.href));
    }
  })
);
