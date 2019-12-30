import { config, feed } from './stores';

import App from '../components/App.html';
import polyfill from './polyfill.io';

polyfill(() => {
  void new App({ target: document.querySelector('main') });

  const query = location.search;
  let url;

  config.subscribe(state => {
    if (url === state.url) return;
    url = state.url;
    feed.fetch(url);
  });

  if (query && query.startsWith('?url=')) {
    const parts = query.substr(5).split('&');
    config.set({ url: decodeURIComponent(parts[0]) });
  }
});
