import { readable, writable } from "svelte/store";

import error from "./error";
import { RssParser } from "./rss-parser";
import { urls } from "./urls";
import { description, version } from "../package.json";
import statusCodes from "./status-codes";

const ObjectStore = defaultState => {
  const { subscribe, update } = writable(defaultState);

  const _update = newState =>
    update(state => {
      Object.keys(newState).forEach(key => {
        if (key in state === false) return;
        state[key] = newState[key];
        // See https://svelte.dev/tutorial/updating-arrays-and-objects
        state = state; // eslint-disable-line no-self-assign
      });

      return state;
    });

  return {
    subscribe,
    update: _update,
    set: _update
  };
};

function fetchFeed(url) {
  if (!url) return;

  const store = this;

  store.set({ loading: true });

  const headers = new Headers({
    Accept: [
      "application/rss+xml",
      "application/rdf+xml",
      "application/atom+xml",
      "application/xml;q=0.9",
      "text/xml;q=0.8"
    ].join()
  });

  fetch(urls.proxy + "?url=" + encodeURIComponent(url), { headers, referrerPolicy: "no-referrer" })
    .then(res => {
      if (res.status > 399) throw Error(statusCodes[res.status]);
      return res.json();
    })
    .then(data => {
      const parser = RssParser();
      const rss = parser.parse(data.content);

      if (!rss.date) rss.date = new Date(data.headers.date);

      store.set({ ...rss, loading: false });
    })
    .catch(message => {
      store.set(error(url, message));
      console.error(message);
    });
}

function fetchReferrers() {
  const store = this;

  fetch(urls.referrers)
    .then(res => res.json())
    .then(data => {
      const hosts = data.reduce((accu, item) => {
        if (item.url.startsWith("http") && !item.url.startsWith(urls.app)) {
          const url = item.url.replace(/^([^.]*)www\./, "$1");
          const host = url.split("/")[2];
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
          data.metadata = item.metadata || { feedUrls: [] };
        }
        return accu;
      }, []);

      const total = hosts.reduce((accu, item) => accu += item.total, 0);

      const referrers = hosts.map(item => {
        item.percentage = (item.total / total) * 100;
        return item;
      });

      referrers.sort((a, b) => b.percentage - a.percentage);
      store.set(referrers);
    });
}

export const formatDate = date => {
  if (!date) return;

  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  const day = date
    .getDate()
    .toString()
    .padStart(2, "0");

  const hours = date
    .getHours()
    .toString()
    .padStart(2, "0");

  const minutes = date
    .getMinutes()
    .toString()
    .padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}, ${hours}:${minutes}h`;
};

export const ConfigStore = () => {
  const store = ObjectStore({
    align: "initial",
    boxFillColor: "#ffead2",
    compact: false,
    fontFace: "10pt sans-serif",
    frameColor: "#b3a28e",
    headless: false,
    height: "",
    linkColor: "#2c7395",
    maxItems: 7,
    radius: 5,
    showXmlButton: true,
    textColor: "#95412b",
    titleBarColor: "#90a8b3",
    titleBarTextColor: "#ffead2",
    url: "",
    width: ""
  });

  return store;
};

export const FeedStore = () => {
  const store = ObjectStore({
    date: new Date(),
    description: "",
    format: "",
    image: "",
    input: "",
    items: [],
    link: "",
    loading: false,
    title: "",
    version: ""
  });

  store.fetch = fetchFeed.bind(store);
  store.formatDate = formatDate.bind(store);
  return store;
};

export const app = readable({ description, version });
export const config = ConfigStore();
export const feed = FeedStore();
export const referrers = writable([]);

referrers.fetch = fetchReferrers.bind(referrers);

// For debugging
//window.stores = { app, config, feed, referrers };
