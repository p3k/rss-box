import '../src/shims';
import RssStore from './RssStore';
import { description, version } from '../package.json';

import App from '../components/App.html';
import { keys, urls } from './settings';

const getQuery = () => {
  const query = [];

  keys.forEach(key => {
    const value = store.get(key);
    if (!value) return;
    query.push(key + '=' + encodeURIComponent(value));
  });

  return query.join('&');
};

const store = new RssStore();

store.compute('code', keys, () => {
  const query = getQuery().replace(/&/g, '&amp;');
  return `<script async defer src='${urls.base}/main.js?${query}'></script>`;
});

const app = new App({
  target: document.querySelector('main'),
  store
});

const query = location.search;
let url;

if (query && query.startsWith('?url=')) {
  const parts = query.substr(5).split('&');
  url = parts[0];
}

store.set({
  align: 'initial',
  appDescription: description,
  appVersion: version,
  boxFillColor: '#ffead2',
  compact: false,
  fontFace: '10pt sans-serif',
  frameColor: '#b3a28e',
  headless: false,
  height: '',
  linkColor: '#2c7395',
  maxItems: 7,
  radius: 5,
  showXmlButton: true,
  textColor: '#95412b',
  titleBarColor: '#90a8b3',
  titleBarTextColor: '#ffead2',
  url: url || urls.default,
  width: ''
});

// For debugging
//window.store = store;

export default app;
