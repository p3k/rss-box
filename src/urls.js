import { urls as environmentUrls } from "./environment";
import localUrls from "../local.json";

export const baseUrl = "http://localhost";

// Requested explicitly rather than left to the server’s own default, so
// this value can’t silently drift out of sync with what Configurator’s
// tooltip tells people to expect
export const referrerDays = 30;

// local.json (a developer’s own override) only applies when a build opts in
// with `--config-local` (see rollup.config.js and INSTALL.md) – otherwise a
// colliding key would silently override environment.js’s real value in any
// regular or staging build
export const urls = {
  app: `${baseUrl}:8000`,
  proxy: `${baseUrl}:8000/roxy`,
  referrers: `${baseUrl}:8000/ferris?group=rss-box&days=${referrerDays}`,
  feed: "https://blog.p3k.org/stories.xml",
  ...environmentUrls,
  ...(process.env.USE_LOCAL_OVERRIDES ? localUrls : {})
};
