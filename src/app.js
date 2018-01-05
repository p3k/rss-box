import RssStore from './RssStore';
import { description, version } from '../package.json';

import App from '../components/App.html';
import { KEYS, URLS } from './settings';

const getFullHexColor = str => {
  str = ('' + str).trim();
  if (str.length > 4) return str;
  let color = str.substr(1);
  return (
    '#' +
    color
      .split('')
      .map(c => c + c)
      .join('')
  );
};

const getCurrentLinkColor = () => {
  let anchor = document.querySelector('a:not([class])');
  let color = window.getComputedStyle(anchor).color;
  if (color.startsWith('#')) return color;
  if (color.startsWith('rgb(')) {
    color = color.trim().substr(4);
    return (
      '#' +
      color
        .split(',')
        .map(c =>
          parseInt(c, 10)
            .toString(16)
            .padStart(2, 0)
        )
        .join('')
    );
  }
};

const getQuery = config => {
  if (!config) return '';
  const query = [];
  for (let key in config) {
    let value = config[key];
    if (key === 'SETTINGS' || !value) continue;
    query.push(key + '=' + encodeURIComponent(value));
  }
  return query.join('&');
};

const getConfig = () => {
  let config = {};

  KEYS.forEach(key => {
    config[key] = store.get(key);
  });

  return config;
};

const store = new RssStore('https://blog.p3k.org/stories.xml');

store.compute('code', KEYS, () => {
  let query = getQuery(getConfig()).replace(/&/g, '&amp;');
  return `<script src='${URLS.base}/main.js?${query}'></script>`;
});

const app = new App({
  target: document.querySelector('main'),
  store
});

store.set({
  appDescription: description,
  appVersion: version,
  boxFillColor: '#ffead2',
  compact: false,
  fontFace: '10pt sans-serif',
  frameColor: '#b3a28e',
  headless: false,
  height: -1,
  linkColor: '#2c7395',
  maxItems: 7,
  radius: 5,
  showXmlButton: true,
  textColor: '#95412b',
  titleBarColor: '#90a8b3',
  titleBarTextColor: '#ffead2',
  width: 200
});

// For debugging
//window.store = store;

export default app;
