import { URLS as LOCAL_URLS } from './local';

export const defaults = {
  boxFillColor: '#fff',
  compact: false,
  fontFace: '10pt sans-serif',
  frameColor: '#000',
  headless: false,
  height: -1,
  linkColor: '',
  maxItems: 7,
  radius: 0,
  showXmlButton: true,
  textColor: '#000',
  titleBarColor: '#add8e6',
  titleBarTextColor: '#000',
  width: 200
};

export const KEYS = [
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

export const URLS = Object.assign(
  {
    base: rootUrl,
    app: rootUrl + '/rss',
    roxy: location.protocol + serviceUrl + '/roxy',
    ferris: location.protocol + serviceUrl + '/ferris?group=rssbox',
    default: 'https://blog.p3k.org/stories.xml'
  },
  LOCAL_URLS
);
