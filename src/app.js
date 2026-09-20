import { parseQuery } from "./embed";
import { config, feed } from "./stores";
import { urls } from "./urls";

import App from "./App.svelte";

const app = new App({
  target: document.querySelector("main"),
  props: { feed, config }
});

let url;

config.subscribe(state => {
  if (url === state.url) return;
  url = state.url;
  feed.fetch(url, feed);
});

const { url: requestedUrl } = parseQuery(location.search.slice(1), ["url"]);

config.set({ url: requestedUrl || urls.feed });

export default app;
