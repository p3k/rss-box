import { config, feed } from './stores';
import { urls } from './urls';

import App from '../components/App.html';

void new App({
  target: document.querySelector('main'),
  props: { feed, config }
});

const query = location.search;
let url;

config.subscribe(state => {
  url = state.url;
  feed.fetch(url, feed);
});

if (query && query.startsWith('?url=')) {
  const parts = query.substr(5).split('&');
  config.set({ url: decodeURIComponent(parts[0]) });
} else {
  config.set({ url: urls.feed });
}
