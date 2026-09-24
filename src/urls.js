import { urls as localUrls } from "./local";

export const baseUrl = "http://localhost";

// Requested explicitly rather than left to the server's own default, so
// this value can't silently drift out of sync with what Configurator's
// tooltip tells people to expect
export const referrerDays = 30;

export const urls = {
  app: `${baseUrl}:8000`,
  proxy: `${baseUrl}:8000/roxy`,
  referrers: `${baseUrl}:8000/ferris?group=rss-box&days=${referrerDays}`,
  feed: "https://blog.p3k.org/stories.xml"
};

Object.keys(localUrls).forEach(key => {
  if (key in urls) urls[key] = localUrls[key];
});
