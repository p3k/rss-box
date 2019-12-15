import { urls as localUrls } from './local';

// These are backwards-compatible settings
export const defaults = {
  align: 'initial',
  boxFillColor: '#fff',
  compact: false,
  fontFace: 'inherit',
  frameColor: '#000',
  headless: false,
  height: '',
  linkColor: '',
  maxItems: 7,
  radius: 0,
  showXmlButton: false,
  textColor: '#000',
  titleBarColor: '#add8e6',
  titleBarTextColor: '#000',
  width: 200
};

export const keys = [
  'align',
  'boxFillColor',
  'compact',
  'fontFace',
  'frameColor',
  'headless',
  'height',
  'linkColor',
  'maxItems',
  'radius',
  'showXmlButton',
  'textColor',
  'titleBarColor',
  'titleBarTextColor',
  'url',
  'width'
];

const baseUrl = 'http://localhost';

const urls = {
  app: baseUrl + ':5000',
  proxy: baseUrl + ':8080/roxy',
  referrers: baseUrl + ':8080/ferris?group=rssbox',
  default: 'https://blog.p3k.org/stories.xml'
};

for (let key in urls) {
  if (key in localUrls) urls[key] = localUrls[key];
}

export { urls };
