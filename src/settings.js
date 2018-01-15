import { urls as localUrls } from './local';

// These are backwards-compatible settings
export const defaults = {
  align: 'initial',
  boxFillColor: '#fff',
  compact: false,
  fontFace: '10pt sans-serif',
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

const rootUrl = '//p3k.org';
const serviceUrl = '//p3k-services.appspot.com';

export const urls = Object.assign(
  {
    base: rootUrl,
    app: rootUrl + '/rss',
    proxy: location.protocol + serviceUrl + '/roxy',
    referrers: location.protocol + serviceUrl + '/ferris?group=rssbox',
    default: 'https://blog.p3k.org/stories.xml'
  },
  localUrls
);
