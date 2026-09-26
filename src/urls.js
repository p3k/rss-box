import { urls as environmentUrls } from "./environment";
import { urls as localUrls } from "./local";

export const baseUrl = "http://localhost";

// Requested explicitly rather than left to the server’s own default, so
// this value can’t silently drift out of sync with what Configurator’s
// tooltip tells people to expect
export const referrerDays = 30;

// environment.js (CI-owned, e.g. staging’s build config) is applied
// before local.js (a developer’s own override), so a personal override
// always wins even if both happen to set the same key
export const urls = {
  app: `${baseUrl}:8000`,
  proxy: `${baseUrl}:8000/roxy`,
  referrers: `${baseUrl}:8000/ferris?group=rss-box&days=${referrerDays}`,
  feed: "https://blog.p3k.org/stories.xml",
  ...environmentUrls,
  ...localUrls
};
