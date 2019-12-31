import { config, feed } from './stores';
import { urls } from './urls';

import App from '../components/App.html';
import polyfill from './polyfill.io';

polyfill(() => {
  void new App({ target: document.querySelector('main') });

  const query = location.search;
  let url;

  config.subscribe(state => {
    if (!state.url || url === state.url) return;
    url = state.url;
    feed.fetch(url);
  });

  if (query && query.startsWith('?url=')) {
    const parts = query.substr(5).split('&');
    config.set({ url: decodeURIComponent(parts[0]) });
  } else {
    config.set({ url: urls.feed });
  }
});
