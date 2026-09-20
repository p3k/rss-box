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

  fetch(`${urls.proxy}?url=${encodeURIComponent(url)}`, {
    headers,
    referrerPolicy: "no-referrer"
  })
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

const isHttpUrl = url => typeof url === "string" && /^https?:\/\//i.test(url);

// Referrers are reported by whichever pages embed a box, so anything they send
// must be treated with care – e.g. a `javascript:` URL is not a feed
const getFeedUrls = metadata =>
  metadata && Array.isArray(metadata.feedUrls)
    ? metadata.feedUrls.filter(isHttpUrl)
    : [];

function fetchReferrers() {
  const store = this;

  return fetch(urls.referrers)
    .then(res => res.json())
    .then(data => {
      const hosts = [];

      // Host names are arbitrary text, so keep them from clashing with any
      // property name (`length`, `constructor` etc.)
      const hostsByName = Object.create(null);

      data.forEach(item => {
        if (
          !isHttpUrl(item.url) ||
          item.url.startsWith(urls.app) ||
          item.url.indexOf("atari-embeds.googleusercontent.com") >= 0
        ) {
          return;
        }

        const url = item.url.replace(/^([^.]*)www\./, "$1");
        const host = url.split("/")[2];
        let referrer = hostsByName[`@${host}`];

        if (!referrer) {
          referrer = { host, url, hits: item.hits, total: 0 };
          hostsByName[`@${host}`] = referrer;
          hosts.push(referrer);
        } else if (item.hits > referrer.hits) {
          referrer.url = item.url;
          referrer.hits = item.hits;
        }

        const feedUrls = getFeedUrls(item.metadata);

        referrer.total += item.hits;
        referrer.metadata = feedUrls.length ? { feedUrls } : {};
      });

      const total = hosts.reduce((sum, referrer) => sum + referrer.total, 0);

      const referrers = hosts.map(referrer => {
        referrer.percentage = (referrer.total / total) * 100;
        return referrer;
      });

      referrers.sort((a, b) => b.percentage - a.percentage);
      store.set(referrers);
    })
    .catch(message => {
      console.error(message);
    });
}

export const formatDate = date => {
  if (!date) return;

  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  const day = date.getDate().toString().padStart(2, "0");

  const hours = date.getHours().toString().padStart(2, "0");

  const minutes = date.getMinutes().toString().padStart(2, "0");

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
