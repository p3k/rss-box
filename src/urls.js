import { urls as localUrls } from './local';

export const baseUrl = 'http://localhost';

export const urls = {
  app: baseUrl + ':8000',
  proxy: baseUrl + ':8080/roxy',
  referrers: baseUrl + ':8080/ferris?group=rssbox',
  feed: 'https://blog.p3k.org/stories.xml'
};

Object.keys(localUrls).forEach(key => {
  if (key in urls) urls[key] = localUrls[key];
});
