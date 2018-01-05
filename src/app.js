import RssStore from './RssStore';
import { description, version } from '../package.json';

import App from '../components/App.html';
import { KEYS, URLS } from './settings';

const getQuery = () => {
  const query = [];

  KEYS.forEach(key => {
    const value = store.get(key);
    if (!value) return;
    query.push(key + '=' + encodeURIComponent(value));
  });

  return query.join('&');
};

const store = new RssStore('https://blog.p3k.org/stories.xml');

store.compute('code', KEYS, () => {
  const query = getQuery().replace(/&/g, '&amp;');
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
