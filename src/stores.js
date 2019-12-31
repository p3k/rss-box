import { readable, writable } from 'svelte/store';

import error from './error';
import { RssParser } from './rss-parser';
import { urls } from './urls';
import { description, version } from '../package.json';

function ObjectStore(defaultState) {
  const { subscribe, update } = writable(defaultState);

  const _update = newState =>
    update(state => {
      Object.keys(newState).forEach(key => {
        if (key in state === false) return;
        state[key] = newState[key];
        // See https://svelte.dev/tutorial/updating-arrays-and-objects
        state = state;
      });

      return state;
    });

  return {
    subscribe,
    update: _update,
    set: _update
  };
}

export const app = readable({ description, version });

export const config = ObjectStore({
  align: 'initial',
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
  url: '',
  width: ''
});

export const feed = ObjectStore({
  date: new Date(),
  description: '',
  format: '',
  image: '',
  input: '',
  items: [],
  loading: false,
  title: '',
  version: ''
});

export const referrers = writable([]);

feed.fetch = url => {
  if (!url) return;

  feed.set({ loading: true });

  const headers = new Headers({
    Accept: [
      'application/rss+xml',
      'application/rdf+xml',
      'application/atom+xml',
      'application/xml;q=0.9',
      'text/xml;q=0.8'
    ].join()
  });

  fetch(urls.proxy + '?url=' + encodeURIComponent(url), { headers, referrerPolicy: 'no-referrer' })
    .then(res => {
      if (!res.ok) throw Error(res.statusText);

      res
        .text()
        .then(json => {
          const parser = RssParser();
          const data = JSON.parse(json);
          if (data.headers['X-Roxy-Error']) throw Error(data.headers['X-Roxy-Error']);
          const rss = parser.parse(data.content);
          if (!rss.date) rss.date = new Date(data.headers.date);
          feed.set({ ...rss, loading: false });
        })
        .catch(message => {
          feed.set(error(url, message));
          console.error(message);
        });
    })
    .catch(message => {
      feed.set(error(url, message));
      console.error(message);
    });
};

referrers.fetch = () => {
  fetch(urls.referrers)
    .then(res => res.json())
    .then(data => {
      const hosts = data.reduce((accu, item) => {
        if (item.url.startsWith('http') && !item.url.startsWith(urls.app)) {
          const url = item.url.replace(/^([^.]*)www\./, '$1');
          const host = url.split('/')[2];
          let data = accu[host];

          if (!data) {
            data = { host, url, hits: item.hits, total: 0 };
            accu[host] = data;
            accu.push(data);
          } else if (item.hits > data.hits) {
            data.url = item.url;
            data.hits = item.hits;
          }

          data.total += item.hits;
        }
        return accu;
      }, []);

      const total = hosts.reduce((accu, item) => accu += item.total, 0);

      const _referrers = hosts.map(item => {
        item.percentage = (item.total / total) * 100;
        return item;
      });

      _referrers.sort((a, b) => b.percentage - a.percentage);

      referrers.set(_referrers);
    });
};

feed.formatDate = date => {
  if (!date) return;

  const month = (date.getMonth() + 1).toString().padStart(2, '0');

  const day = date
    .getDate()
    .toString()
    .padStart(2, '0');

  const hours = date
    .getHours()
    .toString()
    .padStart(2, '0');

  const minutes = date
    .getMinutes()
    .toString()
    .padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}, ${hours}:${minutes}h`;
};

// For debugging
//window.stores = { app, config, feed, referrers };
